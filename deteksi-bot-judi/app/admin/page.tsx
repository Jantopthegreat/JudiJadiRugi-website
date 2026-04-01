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

// ─── HELPERS ───
const labelText = (v: number) => (v === 1 ? "JUDI" : "BUKAN_JUDI");
const labelColor = (v: number) =>
  v === 1
    ? "bg-red-100 text-red-700 border border-red-200"
    : "bg-emerald-100 text-emerald-700 border border-emerald-200";

// ─── MINI BAR CHART ───
function BarChart({
  data,
  valueKey,
  labelKey,
  color = "#3b82f6",
}: {
  data: any[];
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  if (!data.length)
    return (
      <p className="text-gray-400 text-xs text-center py-4">Belum ada data</p>
    );
  const max = Math.max(...data.map((d) => d[valueKey] ?? 0), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <p
            className="text-xs text-gray-600 w-36 truncate shrink-0"
            style={{ fontFamily: "system-ui" }}
          >
            {d[labelKey] || "—"}
          </p>
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${((d[valueKey] ?? 0) / max) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span
            className="text-xs font-bold text-gray-700 w-8 text-right shrink-0"
            style={{ fontFamily: "system-ui" }}
          >
            {d[valueKey] ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── DONUT CHART (SVG) ───
function DonutChart({ judi, bukan }: { judi: number; bukan: number }) {
  const total = judi + bukan || 1;
  const r = 36;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * r;
  const judiPct = judi / total;
  const bukanPct = bukan / total;
  const judiDash = circumference * judiPct;
  const bukanDash = circumference * bukanPct;
  return (
    <div className="flex items-center gap-6">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="10"
        />
        {bukan > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#10b981"
            strokeWidth="10"
            strokeDasharray={`${bukanDash} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        )}
        {judi > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#ef4444"
            strokeWidth="10"
            strokeDasharray={`${judiDash} ${circumference}`}
            strokeDashoffset={-(circumference * bukanPct)}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        )}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#111827"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize="7"
          fill="#6b7280"
        >
          entri
        </text>
      </svg>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span
            className="text-xs text-gray-600"
            style={{ fontFamily: "system-ui" }}
          >
            JUDI: <b className="text-gray-800">{judi}</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span
            className="text-xs text-gray-600"
            style={{ fontFamily: "system-ui" }}
          >
            BUKAN_JUDI: <b className="text-gray-800">{bukan}</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span
            className="text-xs text-gray-600"
            style={{ fontFamily: "system-ui" }}
          >
            Rasio: {bukan}:{judi}
            {judi > 0 && bukan / judi < 2 && (
              <span className="ml-1 text-amber-600 font-bold">
                ⚠ Perlu lebih banyak data
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ───
function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

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
        const e = await res.json();
        throw new Error(e.detail);
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
      className="min-h-screen bg-gray-50 flex items-center justify-center"
      style={{ fontFamily: "system-ui" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            JudiJadiRugi Admin
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Masuk untuk mengelola sistem
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="admin@judidetektor.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {show ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <svg
                className="w-4 h-4 text-red-500 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Akses terbatas · Hanya untuk administrator
        </p>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───
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
  const [overview, setOverview] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
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
  const [error, setError] = useState("");

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
    setError("");
    try {
      const [ovRes, stRes] = await Promise.all([
        fetch(`${API}/admin/overview`, { headers: auth }),
        fetch(`${API}/admin/feedback/stats`, { headers: auth }),
      ]);
      if (!checkAuth(ovRes) || !checkAuth(stRes)) return;
      const ov = await ovRes.json();
      setOverview({
        ...ov,
        daily: ov.daily ?? [],
        top_videos: ov.top_videos ?? [],
        top_channels: ov.top_channels ?? [],
        recent_scans: ov.recent_scans ?? [],
      });
      setStats(await stRes.json());
    } catch (e: any) {
      setError(e.message);
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
      const d = await res.json();
      setFeedbacks(Array.isArray(d.data) ? d.data : []);
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
      const d = await res.json();
      setDataset(Array.isArray(d.data) ? d.data : []);
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
        setStats((s: any) =>
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
    } finally {
      setReviewLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const deleteFeedback = async (id: number) => {
    if (!confirm("Hapus feedback ini?")) return;
    const res = await fetch(`${API}/admin/feedback/${id}`, {
      method: "DELETE",
      headers: auth,
    });
    if (res.ok) setFeedbacks((p) => p.filter((f) => f.id !== id));
    else {
      const e = await res.json();
      alert(e.detail);
    }
  };

  const deleteDatasetEntry = async (id: number) => {
    if (!confirm("Hapus entri ini dari dataset?")) return;
    const res = await fetch(`${API}/admin/dataset/${id}`, {
      method: "DELETE",
      headers: auth,
    });
    if (res.ok) {
      setDataset((p) => p.filter((d: any) => d.id !== id));
    } else {
      const e = await res.json();
      alert(e.detail);
    }
  };

  const deleteAllDataset = async () => {
    if (!confirm("⚠️ HAPUS SEMUA entri dataset? Tidak bisa dibatalkan!"))
      return;
    if (!confirm("Yakin? Semua data training akan hilang permanen.")) return;
    const res = await fetch(`${API}/admin/dataset`, {
      method: "DELETE",
      headers: auth,
    });
    if (res.ok) setDataset([]);
  };

  const exportCSV = () => {
    const csv = [
      "id,comment_text,comment_clean,label_manual,source,proba_judi,pred_label,is_mismatch,created_at",
      ...dataset.map(
        (d: any) =>
          `${d.id},"${(d.comment_text || "").replace(/"/g, '""')}","${(d.comment_clean || "").replace(/"/g, '""')}",${d.label_manual},${d.source},${d.proba_judi},${d.pred_label},${d.is_mismatch},${d.created_at}`,
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    );
    a.download = `feedback_dataset_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const displayed = feedbacks
    .filter((f) => !reviewDone[f.id])
    .filter(
      (f) => filterPrioritas === "semua" || f.prioritas === filterPrioritas,
    );
  const maxBar = overview
    ? Math.max(
        ...(overview.daily || []).map((d: any) => d.total_flagged ?? 0),
        1,
      )
    : 1;

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "system-ui" }}
    >
      {/* TOPBAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-900">JudiJadiRugi</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString("id-ID", { dateStyle: "medium" })}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              Keluar
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="max-w-7xl mx-auto px-6 flex border-t border-gray-100">
          {(
            [
              { key: "overview", label: "Overview", icon: "📊" },
              {
                key: "feedback",
                label: `Antrian Review${stats ? ` (${stats.feedback_queue?.pending ?? 0})` : ""}`,
                icon: "📬",
              },
              { key: "dataset", label: "Feedback Dataset", icon: "🗃️" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {loadingTab && !overview && activeTab === "overview" && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span className="text-sm">Memuat data...</span>
            </div>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && overview && stats && (
          <div className="space-y-5">
            {/* Big stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Scan",
                  val: overview.total_scans ?? 0,
                  icon: "🔍",
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Komentar Diproses",
                  val: (overview.total_comments ?? 0).toLocaleString("id-ID"),
                  icon: "💬",
                  color: "text-violet-600",
                  bg: "bg-violet-50",
                },
                {
                  label: "Terindikasi Judi",
                  val: (overview.total_flagged ?? 0).toLocaleString("id-ID"),
                  icon: "🚨",
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
                {
                  label: "Flagged Rate",
                  val: `${overview.flagged_rate ?? 0}%`,
                  icon: "📈",
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${s.bg} mb-3`}
                  >
                    <span className="text-lg">{s.icon}</span>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Feedback stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Pending Review",
                  val: stats.feedback_queue?.pending ?? 0,
                  color: "text-amber-600",
                },
                {
                  label: "Approved",
                  val: stats.feedback_queue?.approved ?? 0,
                  color: "text-emerald-600",
                },
                {
                  label: "Rejected",
                  val: stats.feedback_queue?.rejected ?? 0,
                  color: "text-red-500",
                },
                {
                  label: "Total Mismatch",
                  val: stats.feedback_queue?.total_mismatch ?? 0,
                  color: "text-violet-600",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between"
                >
                  <span className="text-sm text-gray-500">{s.label}</span>
                  <span className={`text-2xl font-bold ${s.color}`}>
                    {s.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Bar chart 7 hari */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Aktivitas 7 Hari Terakhir
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Jumlah komentar terindikasi per hari
                </p>
                {overview.daily.length > 0 ? (
                  <div className="flex items-end gap-2 h-28">
                    {overview.daily.map((d: any) => (
                      <div
                        key={d.tanggal}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <span className="text-[10px] text-red-500 font-bold">
                          {d.total_flagged ?? 0}
                        </span>
                        <div
                          className="w-full bg-gray-100 rounded-t flex flex-col justify-end"
                          style={{ height: "72px" }}
                        >
                          <div
                            className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                            style={{
                              height: `${((d.total_flagged ?? 0) / maxBar) * 100}%`,
                              minHeight:
                                (d.total_flagged ?? 0) > 0 ? "3px" : "0",
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-gray-400">
                          {new Date(d.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">
                    Belum ada data scan 7 hari terakhir
                  </p>
                )}
              </div>

              {/* Donut dataset balance */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Distribusi Dataset
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Keseimbangan label feedback dataset
                </p>
                <DonutChart
                  judi={stats.feedback_dataset?.total_judi ?? 0}
                  bukan={stats.feedback_dataset?.total_bukan_judi ?? 0}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top channels */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Channel Paling Banyak Komentar Judi
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Berdasarkan total komentar terindikasi
                </p>
                <BarChart
                  data={overview.top_channels}
                  valueKey="total_flagged"
                  labelKey="channel_name"
                  color="#ef4444"
                />
              </div>

              {/* Top videos */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Video Paling Sering Discan
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Berdasarkan jumlah scan
                </p>
                <BarChart
                  data={overview.top_videos}
                  valueKey="scan_count"
                  labelKey="video_title"
                  color="#3b82f6"
                />
              </div>
            </div>

            {/* Recent scans */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Scan Terbaru</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {overview.recent_scans.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">
                    Belum ada riwayat scan
                  </p>
                ) : (
                  overview.recent_scans.map((s: any) => (
                    <div
                      key={s.id}
                      className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {s.video_title || "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {s.channel_name} ·{" "}
                          {new Date(s.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">
                          {s.total_comments} komentar
                        </span>
                        <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                          {s.flagged_count} judi
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FEEDBACK QUEUE ── */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <span className="text-blue-500 text-xl shrink-0">ℹ️</span>
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Apa itu Antrian Review?
                </p>
                <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                  Ini adalah koreksi label yang dikirimkan oleh pengguna umum
                  saat mereka menemukan komentar yang salah terdeteksi. Tugasmu
                  adalah memeriksa setiap koreksi dan memutuskan apakah koreksi
                  tersebut benar (<b>Approve</b>) atau salah (<b>Reject</b>).
                  Koreksi yang disetujui akan otomatis masuk ke{" "}
                  <b>Feedback Dataset</b> untuk bahan evaluasi model.
                </p>
              </div>
            </div>

            {/* Priority info */}
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-600">
                  <b>Prioritas Tinggi</b> = Model salah prediksi (mismatch)
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-gray-600">
                  <b>Prioritas Sedang</b> = Zona abu-abu (proba 50–79%)
                </span>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Filter:</span>
              {(["semua", "tinggi", "sedang"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterPrioritas(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                    filterPrioritas === f
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
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
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                <span className="text-4xl block mb-3">✅</span>
                <p className="text-gray-600 font-medium">
                  Tidak ada feedback pending
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Semua sudah direview atau belum ada koreksi masuk
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((f) => (
                  <FeedbackCard
                    key={f.id}
                    item={f}
                    loading={reviewLoading[f.id]}
                    done={reviewDone[f.id]}
                    onReview={handleReview}
                    onDelete={deleteFeedback}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DATASET ── */}
        {activeTab === "dataset" && (
          <div className="space-y-4">
            {/* Info box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
              <span className="text-emerald-500 text-xl shrink-0">🗃️</span>
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Apa itu Feedback Dataset?
                </p>
                <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                  Ini adalah kumpulan data koreksi label yang sudah disetujui
                  admin dari antrian review. Dataset ini berisi komentar beserta
                  label manualnya yang dapat digunakan sebagai bahan
                  <b> evaluasi dan pelatihan ulang model</b> di masa mendatang
                  untuk meningkatkan akurasi sistem.
                </p>
              </div>
            </div>

            {loadingTab ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Memuat dataset...
              </div>
            ) : dataset.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                <span className="text-4xl block mb-3">📭</span>
                <p className="text-gray-600 font-medium">
                  Dataset masih kosong
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Approve feedback dari antrian review terlebih dahulu
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-800">
                      {dataset.length} entri
                    </span>
                    <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                      JUDI:{" "}
                      {dataset.filter((d: any) => d.label_manual === 1).length}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                      BUKAN_JUDI:{" "}
                      {dataset.filter((d: any) => d.label_manual === 0).length}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportCSV}
                      className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                      Export CSV
                    </button>
                    <button
                      onClick={deleteAllDataset}
                      className="flex items-center gap-1.5 text-sm border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                      Reset Semua
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="max-h-[560px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                      <tr className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="text-left px-5 py-3">Komentar (Asli)</th>
                        <th className="text-left px-5 py-3">
                          Komentar (Clean)
                        </th>
                        <th className="text-left px-5 py-3 w-28">Label</th>
                        <th className="text-left px-5 py-3 w-20">Proba</th>
                        <th className="text-left px-5 py-3 w-20">Mismatch</th>
                        <th className="text-left px-5 py-3 w-16">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dataset.map((d: any, i: number) => (
                        <tr
                          key={d.id ?? i}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-3 max-w-xs">
                            <p className="text-xs text-gray-700 truncate">
                              {d.comment_text || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-3 max-w-xs">
                            <p className="text-xs text-gray-400 truncate">
                              {d.comment_clean || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${labelColor(d.label_manual)}`}
                            >
                              {labelText(d.label_manual)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500 tabular-nums">
                            {(d.proba_judi * 100).toFixed(1)}%
                          </td>
                          <td className="px-5 py-3">
                            {d.is_mismatch ? (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                Mismatch
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {d.id && (
                              <button
                                onClick={() => deleteDatasetEntry(d.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                              </button>
                            )}
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
      </div>
    </div>
  );
}

// ─── FEEDBACK CARD ───
function FeedbackCard({
  item,
  loading,
  done,
  onReview,
  onDelete,
}: {
  item: FeedbackItem;
  loading?: boolean;
  done?: "approved" | "rejected";
  onReview: (id: number, action: "approve" | "reject") => void;
  onDelete: (id: number) => void;
}) {
  const priorityBadge =
    item.prioritas === "tinggi"
      ? "bg-red-100 text-red-700 border-red-200"
      : item.prioritas === "sedang"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-gray-100 text-gray-500 border-gray-200";

  const priorityLabel =
    item.prioritas === "tinggi"
      ? "🔴 Tinggi"
      : item.prioritas === "sedang"
        ? "🟡 Sedang"
        : "⚪ Rendah";

  return (
    <div
      className={`bg-white rounded-xl border-l-4 border border-gray-200 shadow-sm ${
        item.prioritas === "tinggi"
          ? "border-l-red-500"
          : item.prioritas === "sedang"
            ? "border-l-amber-400"
            : "border-l-gray-200"
      }`}
    >
      <div className="p-4">
        {/* Comment */}
        <p className="text-sm text-gray-800 leading-relaxed mb-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          "{item.comment_text}"
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">#{item.id}</span>
          <span className="text-gray-200">·</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${priorityBadge}`}
          >
            {priorityLabel}
          </span>
          {item.is_mismatch === 1 && (
            <span className="text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
              ⚡ Mismatch
            </span>
          )}
          <span className="text-gray-200">·</span>
          <span className="text-xs text-gray-400">
            Proba: {(item.proba_judi * 100).toFixed(1)}%
          </span>
        </div>

        {/* Label comparison */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-500">Prediksi model:</span>
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded ${labelColor(item.pred_label)}`}
            >
              {labelText(item.pred_label)}
            </span>
          </div>
          <svg
            className="w-4 h-4 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <span className="text-xs text-blue-600">Koreksi user:</span>
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded ${labelColor(item.suggested_label)}`}
            >
              {labelText(item.suggested_label)}
            </span>
          </div>
        </div>

        {item.reason && (
          <p className="text-xs text-gray-500 italic bg-yellow-50 border border-yellow-100 rounded px-3 py-1.5 mb-3">
            💬 Alasan: "{item.reason}"
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {new Date(item.created_at).toLocaleDateString("id-ID", {
              dateStyle: "medium",
            })}
          </span>
          <div className="flex items-center gap-2">
            {done ? (
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                  done === "approved"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
              >
                {done === "approved" ? "✓ Disetujui" : "✗ Ditolak"}
              </span>
            ) : (
              <>
                <button
                  onClick={() => onDelete(item.id)}
                  disabled={loading}
                  className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 transition-colors disabled:opacity-40"
                >
                  Hapus
                </button>
                <button
                  onClick={() => onReview(item.id, "reject")}
                  disabled={loading}
                  className="text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                >
                  {loading ? "..." : "✗ Tolak"}
                </button>
                <button
                  onClick={() => onReview(item.id, "approve")}
                  disabled={loading}
                  className="text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                >
                  {loading ? "..." : "✓ Setujui"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ───
export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const t = sessionStorage.getItem("admin_token");
    if (t) setToken(t);
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
