import os
import re
import random
import unicodedata
from datetime import datetime, timedelta

import joblib
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from fastapi.middleware.cors import CORSMiddleware
import jwt
from passlib.context import CryptContext
from typing import Optional, List

load_dotenv()

# ====== Config ======
DATABASE_URL = os.getenv("DATABASE_URL")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
MODEL_PATH = os.getenv("MODEL_PATH", "models/judi_clf.joblib")
VECTORIZER_PATH = os.getenv("VECTORIZER_PATH", "models/judi_vectorizer.joblib")
THRESHOLD = float(os.getenv("THRESHOLD", "0.8"))
THRESHOLD_LOW = float(os.getenv("THRESHOLD_LOW", "0.5"))   # batas bawah berpotensi
JWT_SECRET = os.getenv("JWT_SECRET", "ganti-dengan-secret-yang-kuat")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

# Admin credentials dari .env (tidak disimpan di DB untuk simplisitas)
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@judidetektor.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")  # ganti di .env!

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL belum di-set. Cek file .env")

# ====== DB Engine ======
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# ====== Load ML ======
clf = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)

# ====== Password Hashing ======
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ====== JWT ======
security = HTTPBearer()

def create_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
        "role": "admin"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Bukan admin")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired, silakan login ulang")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

app = FastAPI(title="Judi Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== Schemas ======
class ScanRequest(BaseModel):
    video_url: str
    max_comments: int = Field(default=300, ge=1, le=2000)

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class FeedbackRequest(BaseModel):
    scan_result_id: int
    suggested_label: int = Field(ge=0, le=1)
    reason: Optional[str] = None

class ReviewFeedbackRequest(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")  # "approve" atau "reject"

# ====== Utils ======
EMOJI_RE = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F900-\U0001F9FF"
    "\U0001FA70-\U0001FAFF"
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "]+",
    flags=re.UNICODE
)

def normalize_text(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = re.sub(r"(https?://\S+|www\.\S+)", " <url> ", s)
    s = EMOJI_RE.sub(" ", s)
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def extract_video_id(url: str) -> str:
    m = re.search(r"[?&]v=([A-Za-z0-9_-]{11})", url)
    if m: return m.group(1)
    m = re.search(r"youtu\.be/([A-Za-z0-9_-]{11})", url)
    if m: return m.group(1)
    m = re.search(r"shorts/([A-Za-z0-9_-]{11})", url)
    if m: return m.group(1)
    raise ValueError("Tidak bisa menemukan video_id dari URL.")

def fetch_video_snippet(video_id: str) -> dict:
    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {"key": YOUTUBE_API_KEY, "part": "snippet,statistics", "id": video_id}
    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    data = r.json()
    items = data.get("items", [])
    if not items:
        return {"title": None, "channelTitle": None, "channelId": None, "thumbnail": None, "viewCount": None}
    snip = items[0].get("snippet", {})
    stats = items[0].get("statistics", {})
    thumbnails = snip.get("thumbnails", {})
    thumbnail = (
        thumbnails.get("maxres", {}).get("url") or
        thumbnails.get("high", {}).get("url") or
        thumbnails.get("medium", {}).get("url")
    )
    return {
        "title": snip.get("title"),
        "channelTitle": snip.get("channelTitle"),
        "channelId": snip.get("channelId"),
        "thumbnail": thumbnail,
        "viewCount": stats.get("viewCount"),
        "publishedAt": snip.get("publishedAt"),
    }

def fetch_comments(video_id: str, max_comments: int) -> List[dict]:
    url = "https://www.googleapis.com/youtube/v3/commentThreads"
    comments = []
    page_token = None

    while len(comments) < max_comments:
        params = {
            "key": YOUTUBE_API_KEY,
            "part": "snippet",
            "videoId": video_id,
            "maxResults": 100,
            "textFormat": "plainText",
        }
        if page_token:
            params["pageToken"] = page_token

        r = requests.get(url, params=params, timeout=25)
        r.raise_for_status()
        data = r.json()

        for item in data.get("items", []):
            top = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "text": top.get("textDisplay", "") or "",
                "author": top.get("authorDisplayName", "") or "",
                "author_url": top.get("authorChannelUrl", "") or "",
            })
            if len(comments) >= max_comments:
                break

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return comments

def predict_batch(comments: List[dict]):
    texts = [c["text"] for c in comments]
    clean = [normalize_text(t) for t in texts]
    X = vectorizer.transform(clean)
    proba = clf.predict_proba(X)[:, 1]
    pred = (proba >= THRESHOLD).astype(int)
    return pred.tolist(), proba.tolist(), clean

def get_label_category(proba: float) -> str:
    """Kategorikan proba ke label yang mudah dipahami"""
    if proba >= THRESHOLD:
        return "terindikasi"       # >= 0.8
    elif proba >= THRESHOLD_LOW:
        return "berpotensi"        # 0.5 - 0.79
    else:
        return "aman"              # < 0.5


# ==============================================================================
# PUBLIC ENDPOINTS
# ==============================================================================

@app.get("/health")
def health():
    return {"status": "ok", "threshold": THRESHOLD, "threshold_low": THRESHOLD_LOW}


@app.post("/scan")
def scan(req: ScanRequest):
    """
    Scan komentar YouTube.
    Hanya komentar dengan proba >= 0.5 (berpotensi & terindikasi) yang disimpan ke DB.
    Komentar aman (< 0.5) tidak disimpan untuk efisiensi storage.
    """
    if not YOUTUBE_API_KEY:
        raise HTTPException(status_code=500, detail="YOUTUBE_API_KEY belum di-set di .env")

    try:
        video_id = extract_video_id(req.video_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        meta = fetch_video_snippet(video_id)
        comments = fetch_comments(video_id, req.max_comments)
    except requests.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"YouTube API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gagal ambil data YouTube: {e}")

    if not comments:
        raise HTTPException(status_code=404, detail="Komentar kosong / komentar dimatikan.")

    pred, proba, clean = predict_batch(comments)
    flagged = sum(1 for p in pred if p == 1)
    berpotensi = sum(1 for pr in proba if THRESHOLD_LOW <= pr < THRESHOLD)

    with engine.begin() as conn:
        result = conn.execute(text("""
            INSERT INTO scans
                (video_url, video_id, video_title, channel_name, channel_id,
                max_comments, total_comments, flagged_count, created_at)
            VALUES
                (:video_url, :video_id, :video_title, :channel_name, :channel_id,
                :max_comments, :total_comments, :flagged_count, NOW())
        """), {
            "video_url": req.video_url,
            "video_id": video_id,
            "video_title": meta.get("title"),
            "channel_name": meta.get("channelTitle"),
            "channel_id": meta.get("channelId"),
            "max_comments": req.max_comments,
            "total_comments": len(comments),
            "flagged_count": flagged,
        })
        scan_id = result.lastrowid

        # Hanya simpan komentar berpotensi & terindikasi (proba >= 0.5)
        rows_to_insert = [
            {
                "scan_id": scan_id,
                "comment_text": c["text"],
                "comment_clean": cl,
                "author_name": c["author"],
                "author_url": c["author_url"],
                "pred_label": p,
                "proba_judi": float(pr),
                "threshold_used": float(THRESHOLD),
            }
            for c, cl, p, pr in zip(comments, clean, pred, proba)
            if pr >= THRESHOLD_LOW
        ]

        if rows_to_insert:
            conn.execute(text("""
                INSERT INTO scan_results
                    (scan_id, comment_text, comment_clean, author_name, author_url,
                    pred_label, proba_judi, threshold_used, final_label, corrected_at, created_at)
                VALUES
                    (:scan_id, :comment_text, :comment_clean, :author_name, :author_url,
                    :pred_label, :proba_judi, :threshold_used, NULL, NULL, NOW())
            """), rows_to_insert)

    return {
        "scan_id": scan_id,
        "video_id": video_id,
        "video_title": meta.get("title"),
        "channel_name": meta.get("channelTitle"),
        "thumbnail": meta.get("thumbnail"),
        "view_count": meta.get("viewCount"),
        "published_at": meta.get("publishedAt"),
        "total_comments": len(comments),
        "flagged_count": flagged,
        "berpotensi_count": berpotensi,
        "aman_count": len(comments) - flagged - berpotensi,
        "threshold_used": THRESHOLD,
    }


@app.get("/scans")
def list_scans():
    """Daftar scan terbaru (50 terakhir)"""
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT id, video_id, video_title, channel_name,
                   total_comments, flagged_count, created_at
            FROM scans
            ORDER BY created_at DESC
            LIMIT 50
        """)).mappings().all()
    return list(rows)


@app.get("/scans/{scan_id}")
def scan_detail(scan_id: int):
    """Detail hasil scan beserta komentar yang berpotensi/terindikasi"""
    with engine.begin() as conn:
        scan = conn.execute(
            text("SELECT * FROM scans WHERE id=:id"), {"id": scan_id}
        ).mappings().first()

        if not scan:
            raise HTTPException(status_code=404, detail="Scan tidak ditemukan")

        results = conn.execute(text("""
            SELECT id, comment_text, author_name, author_url,
                   pred_label, proba_judi, threshold_used,
                   final_label, corrected_at, created_at
            FROM scan_results
            WHERE scan_id=:scan_id
            ORDER BY proba_judi DESC
            LIMIT 500
        """), {"scan_id": scan_id}).mappings().all()

    # Tambahkan kategori label ke tiap result
    enriched = []
    for r in results:
        row = dict(r)
        row["kategori"] = get_label_category(row["proba_judi"])
        enriched.append(row)

    return {"scan": dict(scan), "results": enriched}


@app.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    """
    Publik bisa submit koreksi label komentar.
    Masuk ke feedback_queue dengan status pending, menunggu review admin.
    """
    with engine.begin() as conn:
        # Cek scan_result ada
        row = conn.execute(text("""
            SELECT id, comment_text, comment_clean, pred_label, proba_judi
            FROM scan_results WHERE id=:id
        """), {"id": req.scan_result_id}).mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Komentar tidak ditemukan")

        # Cek apakah sudah pernah submit feedback untuk result ini
        existing = conn.execute(text("""
            SELECT id FROM feedback_queue
            WHERE scan_result_id=:id AND status='pending'
        """), {"id": req.scan_result_id}).first()

        if existing:
            raise HTTPException(status_code=409, detail="Feedback untuk komentar ini sudah ada dan sedang menunggu review")

        conn.execute(text("""
            INSERT INTO feedback_queue
                (scan_result_id, comment_text, comment_clean, pred_label,
                proba_judi, suggested_label, reason, status, created_at)
            VALUES
                (:scan_result_id, :comment_text, :comment_clean, :pred_label,
                :proba_judi, :suggested_label, :reason, 'pending', NOW())
        """), {
            "scan_result_id": req.scan_result_id,
            "comment_text": row["comment_text"],
            "comment_clean": row["comment_clean"],
            "pred_label": row["pred_label"],
            "proba_judi": row["proba_judi"],
            "suggested_label": req.suggested_label,
            "reason": req.reason,
        })

    return {
        "message": "Feedback berhasil dikirim, menunggu review admin",
        "scan_result_id": req.scan_result_id,
        "suggested_label": req.suggested_label,
    }


# ==============================================================================
# ADMIN ENDPOINTS
# ==============================================================================

@app.post("/admin/login")
def admin_login(req: AdminLoginRequest):
    """Login admin, return JWT token"""
    if req.email != ADMIN_EMAIL or req.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Email atau password salah")

    token = create_token(req.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": f"{JWT_EXPIRE_HOURS} jam"
    }


@app.get("/admin/me")
def admin_me(payload: dict = Depends(verify_token)):
    """Cek info admin yang sedang login"""
    return {"email": payload.get("sub"), "role": payload.get("role")}


@app.get("/admin/feedback/pending")
def list_pending_feedback(payload: dict = Depends(verify_token)):
    """
    List feedback yang menunggu review, diurutkan berdasarkan prioritas:
    - Prioritas tinggi: mismatch (pred != suggested)
    - Prioritas sedang: zona abu-abu (proba 0.5-0.79)
    - Lainnya
    """
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT
                fq.id,
                fq.scan_result_id,
                fq.comment_text,
                fq.pred_label,
                fq.proba_judi,
                fq.suggested_label,
                fq.reason,
                fq.status,
                fq.created_at,
                CASE
                    WHEN fq.pred_label != fq.suggested_label THEN 1
                    ELSE 0
                END AS is_mismatch,
                CASE
                    WHEN fq.pred_label != fq.suggested_label THEN 'tinggi'
                    WHEN fq.proba_judi BETWEEN 0.5 AND 0.79 THEN 'sedang'
                    ELSE 'rendah'
                END AS prioritas
            FROM feedback_queue fq
            WHERE fq.status = 'pending'
            ORDER BY is_mismatch DESC, fq.proba_judi DESC
            LIMIT 100
        """)).mappings().all()

    return {
        "total": len(rows),
        "data": list(rows)
    }


@app.get("/admin/feedback/stats")
def feedback_stats(payload: dict = Depends(verify_token)):
    """Statistik feedback untuk dashboard admin"""
    with engine.begin() as conn:
        stats = conn.execute(text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN pred_label != suggested_label THEN 1 ELSE 0 END) as total_mismatch
            FROM feedback_queue
        """)).mappings().first()

        dataset_count = conn.execute(text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN label_manual=1 THEN 1 ELSE 0 END) as total_judi,
                SUM(CASE WHEN label_manual=0 THEN 1 ELSE 0 END) as total_bukan_judi
            FROM feedback_dataset
        """)).mappings().first()

    return {
        "feedback_queue": dict(stats),
        "feedback_dataset": dict(dataset_count)
    }


@app.put("/admin/feedback/{feedback_id}/review")
def review_feedback(
    feedback_id: int,
    req: ReviewFeedbackRequest,
    payload: dict = Depends(verify_token)
):
    """
    Admin approve atau reject feedback.
    Jika approve → otomatis masuk feedback_dataset.
    """
    with engine.begin() as conn:
        row = conn.execute(text("""
            SELECT * FROM feedback_queue WHERE id=:id
        """), {"id": feedback_id}).mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Feedback tidak ditemukan")

        if row["status"] != "pending":
            raise HTTPException(status_code=409, detail=f"Feedback sudah di-{row['status']}")

        # Update status di feedback_queue
        conn.execute(text("""
            UPDATE feedback_queue
            SET status=:status, reviewed_at=NOW()
            WHERE id=:id
        """), {"status": req.action + "d", "id": feedback_id})
        # "approve" → "approved", "reject" → "rejected"

        # Kalau approve → masuk feedback_dataset
        if req.action == "approve":
            is_mismatch = 1 if row["pred_label"] != row["suggested_label"] else 0

            conn.execute(text("""
                INSERT INTO feedback_dataset
                    (comment_text, comment_clean, label_manual, source,
                    feedback_queue_id, proba_judi, pred_label, is_mismatch, created_at)
                VALUES
                    (:comment_text, :comment_clean, :label_manual, 'approved_feedback',
                    :feedback_queue_id, :proba_judi, :pred_label, :is_mismatch, NOW())
            """), {
                "comment_text": row["comment_text"],
                "comment_clean": row["comment_clean"],
                "label_manual": row["suggested_label"],
                "feedback_queue_id": feedback_id,
                "proba_judi": row["proba_judi"],
                "pred_label": row["pred_label"],
                "is_mismatch": is_mismatch,
            })

    return {
        "id": feedback_id,
        "action": req.action,
        "masuk_dataset": req.action == "approve",
        "reviewed_at": datetime.utcnow().isoformat()
    }


@app.get("/admin/feedback/export")
def export_feedback_dataset(payload: dict = Depends(verify_token)):
    """Export feedback_dataset untuk keperluan re-training model"""
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT
                comment_clean,
                label_manual,
                source,
                proba_judi,
                pred_label,
                is_mismatch,
                created_at
            FROM feedback_dataset
            ORDER BY created_at DESC
        """)).mappings().all()

    return {
        "total": len(rows),
        "total_judi": sum(1 for r in rows if r["label_manual"] == 1),
        "total_bukan_judi": sum(1 for r in rows if r["label_manual"] == 0),
        "data": list(rows)
    }


@app.get("/admin/scans")
def admin_list_scans(payload: dict = Depends(verify_token)):
    """Admin: lihat semua riwayat scan"""
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT id, video_id, video_title, channel_name,
                   total_comments, flagged_count, created_at
            FROM scans
            ORDER BY created_at DESC
            LIMIT 100
        """)).mappings().all()
    return list(rows)


@app.get("/admin/overview")
def admin_overview(payload: dict = Depends(verify_token)):
    """Admin: statistik overview untuk dashboard"""
    with engine.begin() as conn:
        # Total scan
        total_scans = conn.execute(text("SELECT COUNT(*) as c FROM scans")).mappings().first()["c"]

        # Total komentar diproses
        total_comments = conn.execute(text("SELECT SUM(total_comments) as c FROM scans")).mappings().first()["c"] or 0

        # Total terindikasi
        total_flagged = conn.execute(text("SELECT SUM(flagged_count) as c FROM scans")).mappings().first()["c"] or 0

        # Scan 7 hari terakhir (per hari)
        daily = conn.execute(text("""
            SELECT
                DATE(created_at) as tanggal,
                COUNT(*) as jumlah_scan,
                SUM(total_comments) as total_komentar,
                SUM(flagged_count) as total_flagged
            FROM scans
            WHERE created_at >= NOW() - INTERVAL 7 DAY
            GROUP BY DATE(created_at)
            ORDER BY tanggal ASC
        """)).mappings().all()

        # Top 5 video paling banyak discan
        top_videos = conn.execute(text("""
            SELECT video_title, channel_name, video_id,
                   COUNT(*) as scan_count,
                   AVG(flagged_count) as avg_flagged
            FROM scans
            WHERE video_title IS NOT NULL
            GROUP BY video_id, video_title, channel_name
            ORDER BY scan_count DESC
            LIMIT 5
        """)).mappings().all()

        # Scan terbaru
        recent = conn.execute(text("""
            SELECT id, video_title, channel_name,
                   total_comments, flagged_count, created_at
            FROM scans
            ORDER BY created_at DESC
            LIMIT 5
        """)).mappings().all()

    return {
        "total_scans": total_scans,
        "total_comments": int(total_comments),
        "total_flagged": int(total_flagged),
        "flagged_rate": round((int(total_flagged) / int(total_comments) * 100), 2) if total_comments else 0,
        "daily": list(daily),
        "top_videos": list(top_videos),
        "recent_scans": list(recent),
    }