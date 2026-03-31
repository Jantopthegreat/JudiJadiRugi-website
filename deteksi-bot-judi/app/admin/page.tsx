"use client";
import { useState, useEffect } from "react";

const API = "http://localhost:8000";

type FeedbackItem = {
  id: number;
  scan_result_id: number;
  comment_text: string;
  pred_label: number;
  proba_judi: number;
  suggested_label: number;
  reason: string | null;
  status: string;
  is_mismatch: number;
  prioritas: "tinggi" | "sedang" | "rendah";
  created_at: string;
};

type Overview = {
  total_scans: number;
  total_comments: number;
  total_flagged: number;
  flagged_rate: number;
  daily: {
    tanggal: string;
    jumlah_scan: number;
    total_komentar: number;
    total_flagged: number;
  }[];
  top_videos: {
    video_title: string;
    channel_name: string;
    scan_count: number;
    avg_flagged: number;
  }[];
  recent_scans: {
    id: number;
    video_title: string;
    channel_name: string;
    total_comments: number;
    flagged_count: number;
    created_at: string;
  }[];
};

type Stats = {
  feedback_queue: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    total_mismatch: number;
  };
  feedback_dataset: {
    total: number;
    total_judi: number;
    total_bukan_judi: number;
  };
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login gagal");
      }
      const data = await res.json();
      sessionStorage.setItem("admin_token", data.access_token);
      onLogin(data.access_token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0c0c0c] flex items-center justify-center"
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-red-500" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-white/30">
              Restricted Access
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            JUDIWATCH
          </h1>
          <p className="text-white/30 text-xs mt-1 tracking-wider">
            ADMIN PANEL v1.0
          </p>
        </div>
        <div className="space-y-3">
          <div className="border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-3 py-1.5">
              <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">
                Email
              </span>
            </div>
            <input
              className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder-white/20"
              placeholder="admin@judidetektor.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div className="border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-3 py-1.5 flex justify-between">
              <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">
                Password
              </span>
              <button
                onClick={() => setShowPass(!showPass)}
                className="text-[9px] tracking-widest uppercase text-white/20 hover:text-white/50 transition-colors"
              >
                {showPass ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <input
              type={showPass ? "text" : "password"}
              className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder-white/20"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          {error && (
            <div className="border-l-2 border-red-500 pl-3 py-1">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full bg-white text-black py-3 text-xs font-bold tracking-[0.3em] uppercase hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </div>
        <p className="text-white/15 text-[10px] text-center mt-8 tracking-wider">
          Akses tidak sah akan dicatat dan dilaporkan.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function AdminDashboard({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "feedback" | "dataset"
  >("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [overviewError, setOverviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState<Record<number, boolean>>(
    {},
  );
  const [reviewDone, setReviewDone] = useState<
    Record<number, "approved" | "rejected">
  >({});
  const [filterPrioritas, setFilterPrioritas] = useState<
    "semua" | "tinggi" | "sedang"
  >("semua");
  const [loadingTab, setLoadingTab] = useState(false);

  const auth = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const checkAuth = (res: Response) => {
    if (res.status === 401) {
      onLogout();
      return false;
    }
    return true;
  };

  const loadOverview = async () => {
    setLoadingTab(true);
    setOverviewError("");
    try {
      const [ovRes, stRes] = await Promise.all([
        fetch(`${API}/admin/overview`, { headers: auth }),
        fetch(`${API}/admin/feedback/stats`, { headers: auth }),
      ]);
      if (!checkAuth(ovRes) || !checkAuth(stRes)) return;
      const ovData = await ovRes.json();
      const stData = await stRes.json();
      // Pastikan array fields tidak undefined
      setOverview({
        ...ovData,
        total_scans: ovData.total_scans ?? 0,
        total_comments: ovData.total_comments ?? 0,
        total_flagged: ovData.total_flagged ?? 0,
        flagged_rate: ovData.flagged_rate ?? 0,
        daily: ovData.daily ?? [],
        top_videos: ovData.top_videos ?? [],
        recent_scans: ovData.recent_scans ?? [],
      });
      setStats(stData);
    } catch (e: any) {
      setOverviewError(e.message);
    } finally {
      setLoadingTab(false);
    }
  };

  const loadFeedbacks = async () => {
    setLoadingTab(true);
    try {
      const res = await fetch(`${API}/admin/feedback/pending`, {
        headers: auth,
      });
      if (!checkAuth(res)) return;
      const data = await res.json();
      setFeedbacks(Array.isArray(data.data) ? data.data : []);
    } finally {
      setLoadingTab(false);
    }
  };

  const loadDataset = async () => {
    setLoadingTab(true);
    try {
      const res = await fetch(`${API}/admin/feedback/export`, {
        headers: auth,
      });
      const data = await res.json();
      setDataset(Array.isArray(data.data) ? data.data : []);
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") loadOverview();
    else if (activeTab === "feedback") {
      loadFeedbacks();
      if (!stats)
        fetch(`${API}/admin/feedback/stats`, { headers: auth })
          .then((r) => r.json())
          .then(setStats);
    } else if (activeTab === "dataset") loadDataset();
  }, [activeTab]);

  const handleReview = async (id: number, action: "approve" | "reject") => {
    setReviewLoading((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`${API}/admin/feedback/${id}/review`, {
        method: "PUT",
        headers: auth,
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setReviewDone((p) => ({
          ...p,
          [id]: action === "approve" ? "approved" : "rejected",
        }));
        if (stats) {
          setStats((s) =>
            s
              ? {
                  ...s,
                  feedback_queue: {
                    ...s.feedback_queue,
                    pending: s.feedback_queue.pending - 1,
                    approved:
                      action === "approve"
                        ? s.feedback_queue.approved + 1
                        : s.feedback_queue.approved,
                    rejected:
                      action === "reject"
                        ? s.feedback_queue.rejected + 1
                        : s.feedback_queue.rejected,
                  },
                }
              : s,
          );
        }
      }
    } finally {
      setReviewLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const exportCSV = () => {
    const csv = [
      "comment_clean,label_manual,source,proba_judi,pred_label,is_mismatch",
      ...dataset.map(
        (d) =>
          `"${(d.comment_clean || "").replace(/"/g, '""')}",${d.label_manual},${d.source},${d.proba_judi},${d.pred_label},${d.is_mismatch}`,
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `feedback_dataset_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const displayed = feedbacks
    .filter((f) => !reviewDone[f.id])
    .filter(
      (f) => filterPrioritas === "semua" || f.prioritas === filterPrioritas,
    );
  const now = new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Bar chart helper
  const maxFlagged = overview
    ? Math.max(...overview.daily.map((d) => d.total_flagged), 1)
    : 1;

  return (
    <div
      className="min-h-screen bg-[#0c0c0c] text-white"
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* NAV */}
      <nav className="border-b border-white/10 relative z-10 sticky top-0 bg-[#0c0c0c]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 animate-pulse" />
              <span className="text-xs font-bold tracking-[0.3em] uppercase">
                JudiWatch
              </span>
            </div>
            <span className="text-white/15">|</span>
            <span className="text-white/30 text-[10px] tracking-widest uppercase">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/20 text-[10px] hidden sm:block">
              {now}
            </span>
            <button
              onClick={onLogout}
              className="text-[10px] tracking-widest uppercase text-white/30 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* TABS */}
      <div className="border-b border-white/10 relative z-10 bg-[#0c0c0c]">
        <div className="max-w-6xl mx-auto px-6 flex">
          {(
            [
              { key: "overview", label: "Overview" },
              {
                key: "feedback",
                label: `Antrian Review${stats ? ` (${stats.feedback_queue.pending})` : ""}`,
              },
              { key: "dataset", label: "Feedback Dataset" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-[10px] tracking-[0.25em] uppercase font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-white text-white"
                  : "border-transparent text-white/25 hover:text-white/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        {loadingTab && activeTab === "overview" && !overview ? (
          <p className="text-white/20 text-xs tracking-widest text-center py-20">
            Memuat data...
          </p>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" &&
              (overviewError ? (
                <div className="border-l-2 border-red-500 pl-4 py-2">
                  <p className="text-red-400 text-xs">
                    Gagal memuat overview: {overviewError}
                  </p>
                  <button
                    onClick={loadOverview}
                    className="text-[10px] text-white/40 underline mt-1"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : overview && stats ? (
                <div className="space-y-6">
                  {/* Big stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatBox
                      label="Total Scan"
                      value={overview.total_scans ?? 0}
                      accent="white"
                    />
                    <StatBox
                      label="Komentar Diproses"
                      value={(overview.total_comments ?? 0).toLocaleString(
                        "id-ID",
                      )}
                      accent="blue"
                    />
                    <StatBox
                      label="Terindikasi Judi"
                      value={(overview.total_flagged ?? 0).toLocaleString(
                        "id-ID",
                      )}
                      accent="red"
                    />
                    <StatBox
                      label="Flagged Rate"
                      value={`${overview.flagged_rate ?? 0}%`}
                      accent="yellow"
                    />
                  </div>

                  {/* Feedback stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatBox
                      label="Pending Review"
                      value={stats.feedback_queue.pending}
                      accent="yellow"
                      small
                    />
                    <StatBox
                      label="Approved"
                      value={stats.feedback_queue.approved}
                      accent="green"
                      small
                    />
                    <StatBox
                      label="Total Dataset"
                      value={stats.feedback_dataset.total}
                      accent="blue"
                      small
                    />
                    <StatBox
                      label="Mismatch"
                      value={stats.feedback_queue.total_mismatch}
                      accent="red"
                      small
                    />
                  </div>

                  {/* Dataset balance */}
                  <div className="border border-white/10 p-5">
                    <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-4">
                      Keseimbangan Feedback Dataset
                    </p>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-emerald-400 font-bold">
                            Bukan Judi (0)
                          </span>
                          <span className="text-white/40">
                            {stats.feedback_dataset.total_bukan_judi}
                          </span>
                        </div>
                        <div className="h-3 bg-white/5">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: stats.feedback_dataset.total
                                ? `${(stats.feedback_dataset.total_bukan_judi / stats.feedback_dataset.total) * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-white/20 text-xs pb-1">vs</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-red-400 font-bold">
                            Judi (1)
                          </span>
                          <span className="text-white/40">
                            {stats.feedback_dataset.total_judi}
                          </span>
                        </div>
                        <div className="h-3 bg-white/5">
                          <div
                            className="h-full bg-red-500"
                            style={{
                              width: stats.feedback_dataset.total
                                ? `${(stats.feedback_dataset.total_judi / stats.feedback_dataset.total) * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    {stats.feedback_dataset.total > 0 && (
                      <p className="text-[10px] text-white/20 mt-3">
                        Rasio: {stats.feedback_dataset.total_bukan_judi} :{" "}
                        {stats.feedback_dataset.total_judi} —{" "}
                        {stats.feedback_dataset.total_judi /
                          (stats.feedback_dataset.total_bukan_judi || 1) <
                        0.3
                          ? "⚠️ Dataset tidak seimbang, butuh lebih banyak data judi"
                          : "✓ Distribusi cukup seimbang"}
                      </p>
                    )}
                  </div>

                  {/* 7 hari bar chart */}
                  {overview.daily.length > 0 && (
                    <div className="border border-white/10 p-5">
                      <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-5">
                        Aktivitas 7 Hari Terakhir
                      </p>
                      <div className="flex items-end gap-2 h-24">
                        {overview.daily.map((d) => (
                          <div
                            key={d.tanggal}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <span className="text-[9px] text-red-400 tabular-nums">
                              {d.total_flagged}
                            </span>
                            <div
                              className="w-full bg-white/5 flex flex-col justify-end"
                              style={{ height: "60px" }}
                            >
                              <div
                                className="w-full bg-red-600/70 hover:bg-red-500 transition-colors"
                                style={{
                                  height: `${(d.total_flagged / maxFlagged) * 100}%`,
                                  minHeight: d.total_flagged > 0 ? "2px" : "0",
                                }}
                              />
                            </div>
                            <span className="text-[8px] text-white/20 tabular-nums">
                              {new Date(d.tanggal).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-white/20 mt-2">
                        ↑ Jumlah komentar terindikasi per hari
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top videos */}
                    {overview.top_videos.length > 0 && (
                      <div className="border border-white/10 p-5">
                        <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-4">
                          Video Paling Sering Discan
                        </p>
                        <div className="space-y-3">
                          {overview.top_videos.map((v, i) => (
                            <div
                              key={i}
                              className="flex gap-3 pb-2 border-b border-white/[0.05] last:border-0"
                            >
                              <span className="text-[10px] font-bold text-white/20 w-4 shrink-0">
                                {i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/70 truncate">
                                  {v.video_title || "—"}
                                </p>
                                <p className="text-[10px] text-white/30">
                                  {v.channel_name}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-white/60">
                                  {v.scan_count}x
                                </p>
                                <p className="text-[9px] text-white/25">
                                  discan
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent scans */}
                    <div className="border border-white/10 p-5">
                      <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-4">
                        Scan Terbaru
                      </p>
                      <div className="space-y-3">
                        {overview.recent_scans.map((s) => (
                          <div
                            key={s.id}
                            className="flex gap-3 pb-2 border-b border-white/[0.05] last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/70 truncate">
                                {s.video_title || "—"}
                              </p>
                              <p className="text-[10px] text-white/30">
                                {s.channel_name}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-red-400">
                                {s.flagged_count}
                              </p>
                              <p className="text-[9px] text-white/25">
                                terindikasi
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null)}

            {/* ── FEEDBACK TAB ── */}
            {activeTab === "feedback" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">
                    Filter:
                  </span>
                  {(["semua", "tinggi", "sedang"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterPrioritas(f)}
                      className={`text-[10px] tracking-wider uppercase px-3 py-1 border transition-colors ${
                        filterPrioritas === f
                          ? "border-white text-white bg-white/10"
                          : "border-white/10 text-white/30 hover:border-white/30 hover:text-white/60"
                      }`}
                    >
                      {f === "semua"
                        ? "Semua"
                        : f === "tinggi"
                          ? "🔴 Prioritas Tinggi"
                          : "🟡 Prioritas Sedang"}
                    </button>
                  ))}
                </div>
                {displayed.length === 0 ? (
                  <div className="border border-white/10 py-20 text-center">
                    <p className="text-white/20 text-sm tracking-widest uppercase">
                      Tidak ada feedback pending
                    </p>
                    <p className="text-white/10 text-xs mt-2">
                      Semua sudah direview atau belum ada feedback masuk
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayed.map((f) => (
                      <FeedbackCard
                        key={f.id}
                        item={f}
                        loading={reviewLoading[f.id]}
                        done={reviewDone[f.id]}
                        onReview={handleReview}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── DATASET TAB ── */}
            {activeTab === "dataset" && (
              <div>
                {loadingTab ? (
                  <p className="text-white/20 text-xs py-20 text-center tracking-widest">
                    Memuat dataset...
                  </p>
                ) : dataset.length === 0 ? (
                  <div className="border border-white/10 py-20 text-center">
                    <p className="text-white/20 text-sm tracking-widest uppercase">
                      Dataset masih kosong
                    </p>
                    <p className="text-white/10 text-xs mt-2">
                      Approve feedback terlebih dahulu
                    </p>
                  </div>
                ) : (
                  <div className="border border-white/10">
                    <div className="border-b border-white/10 px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">
                          {dataset.length} entri
                        </span>
                        <span className="text-[10px] text-emerald-400">
                          {dataset.filter((d) => d.label_manual === 0).length}{" "}
                          bukan judi
                        </span>
                        <span className="text-[10px] text-red-400">
                          {dataset.filter((d) => d.label_manual === 1).length}{" "}
                          judi
                        </span>
                      </div>
                      <button
                        onClick={exportCSV}
                        className="text-[10px] tracking-widest uppercase border border-white/20 px-4 py-1.5 text-white/50 hover:text-white hover:border-white transition-colors flex items-center gap-2"
                      >
                        <span>↓</span> Export CSV
                      </button>
                    </div>
                    <div className="max-h-[560px] overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#0c0c0c]">
                          <tr className="border-b border-white/10 text-[9px] tracking-[0.2em] uppercase text-white/25">
                            <th className="text-left px-4 py-2.5">
                              Komentar (clean)
                            </th>
                            <th className="text-left px-4 py-2.5 w-20">
                              Label
                            </th>
                            <th className="text-left px-4 py-2.5 w-20">
                              Proba
                            </th>
                            <th className="text-left px-4 py-2.5 w-20">
                              Mismatch
                            </th>
                            <th className="text-left px-4 py-2.5 w-32">
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataset.map((d, i) => (
                            <tr
                              key={i}
                              className="border-t border-white/[0.04] hover:bg-white/[0.02]"
                            >
                              <td className="px-4 py-2.5 text-white/50 max-w-xs">
                                <p className="truncate">{d.comment_clean}</p>
                              </td>
                              <td className="px-4 py-2.5">
                                <span
                                  className={`font-bold text-[10px] ${d.label_manual === 1 ? "text-red-400" : "text-emerald-400"}`}
                                >
                                  {d.label_manual === 1 ? "JUDI" : "AMAN"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-white/30 tabular-nums">
                                {(d.proba_judi * 100).toFixed(1)}%
                              </td>
                              <td className="px-4 py-2.5">
                                {d.is_mismatch ? (
                                  <span className="text-yellow-400 font-bold text-[10px]">
                                    YA
                                  </span>
                                ) : (
                                  <span className="text-white/15">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-white/20 text-[9px] tracking-wider uppercase">
                                {d.source}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────
function StatBox({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  accent: string;
  small?: boolean;
}) {
  const colors: Record<string, string> = {
    white: "text-white",
    yellow: "text-yellow-400",
    green: "text-emerald-400",
    red: "text-red-400",
    blue: "text-sky-400",
  };
  return (
    <div className="border border-white/10 p-4 bg-white/[0.02]">
      <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-2">
        {label}
      </p>
      <p
        className={`font-bold tabular-nums ${small ? "text-2xl" : "text-3xl"} ${colors[accent] || "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function FeedbackCard({
  item,
  loading,
  done,
  onReview,
}: {
  item: FeedbackItem;
  loading?: boolean;
  done?: "approved" | "rejected";
  onReview: (id: number, action: "approve" | "reject") => void;
}) {
  const borderColor =
    item.prioritas === "tinggi"
      ? "border-l-red-500"
      : item.prioritas === "sedang"
        ? "border-l-yellow-500"
        : "border-l-white/10";
  return (
    <div
      className={`border border-white/10 border-l-2 ${borderColor} bg-white/[0.02] hover:bg-white/[0.03] transition-colors`}
    >
      <div className="px-4 py-3 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/75 leading-relaxed mb-2">
            "{item.comment_text}"
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/25 tracking-wider">
            <span>#{item.id}</span>
            <span>|</span>
            <span
              className={
                item.pred_label === 1 ? "text-red-400" : "text-emerald-400"
              }
            >
              Prediksi: {item.pred_label === 1 ? "JUDI" : "AMAN"}
            </span>
            <span>→</span>
            <span
              className={
                item.suggested_label === 1 ? "text-red-400" : "text-emerald-400"
              }
            >
              Koreksi: {item.suggested_label === 1 ? "JUDI" : "AMAN"}
            </span>
            <span>|</span>
            <span>Proba: {(item.proba_judi * 100).toFixed(1)}%</span>
            {item.is_mismatch === 1 && (
              <>
                <span>|</span>
                <span className="text-yellow-400 font-bold">⚡ MISMATCH</span>
              </>
            )}
          </div>
          {item.reason && (
            <p className="text-[11px] text-white/20 mt-1.5 italic">
              Alasan: "{item.reason}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {done ? (
            <span
              className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 border ${done === "approved" ? "border-emerald-500/50 text-emerald-400" : "border-red-500/50 text-red-400"}`}
            >
              {done === "approved" ? "✓ Approved" : "✗ Rejected"}
            </span>
          ) : (
            <>
              <button
                onClick={() => onReview(item.id, "reject")}
                disabled={loading}
                className="text-[10px] tracking-widest uppercase px-3 py-1.5 border border-white/10 text-white/35 hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-30"
              >
                {loading ? "..." : "Reject"}
              </button>
              <button
                onClick={() => onReview(item.id, "approve")}
                disabled={loading}
                className="text-[10px] tracking-widest uppercase px-3 py-1.5 border border-white/10 text-white/35 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors disabled:opacity-30"
              >
                {loading ? "..." : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    setToken(null);
  };

  if (!token)
    return (
      <LoginPage
        onLogin={(t) => {
          sessionStorage.setItem("admin_token", t);
          setToken(t);
        }}
      />
    );
  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
