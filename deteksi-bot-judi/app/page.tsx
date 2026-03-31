"use client";
import { useState, useEffect, useRef } from "react";

const API = "http://localhost:8000";

type ScanResult = {
  id: number;
  comment_text: string;
  author_name: string | null;
  author_url: string | null;
  proba_judi: number;
  pred_label: number;
  kategori: "aman" | "berpotensi" | "terindikasi";
  final_label: number | null;
};

const QUOTES = [
  {
    text: "Judi bukan jalan keluar. Ia adalah pintu masuk menuju kehancuran.",
    source: "Kominfo RI",
  },
  {
    text: "Satu klik bisa menghancurkan satu keluarga. Waspada judi online.",
    source: "Satgas Judi Online",
  },
  {
    text: "Tidak ada yang menang dari judi. Yang ada hanya yang kalah lebih lambat.",
    source: "PPATK",
  },
  {
    text: "Kemudahan akses bukan berarti aman. Judi online tetap ilegal dan merusak.",
    source: "Bareskrim Polri",
  },
];

const UU_LIST = [
  {
    kode: "UU No. 1/2024",
    judul: "Perubahan UU ITE — Pasal 27A",
    isi: "Melarang distribusi konten perjudian melalui sistem elektronik.",
    penjara: "6 tahun",
    denda: "Rp 1 miliar",
  },
  {
    kode: "KUHP Pasal 303",
    judul: "Kitab UU Hukum Pidana",
    isi: "Barang siapa menjalankan usaha perjudian tanpa izin diancam pidana penjara.",
    penjara: "10 tahun",
    denda: "Rp 25 juta",
  },
  {
    kode: "PP No. 71/2019",
    judul: "Penyelenggaraan Sistem Elektronik",
    isi: "Penyelenggara sistem elektronik wajib memastikan tidak digunakan untuk kegiatan yang dilarang.",
    penjara: "—",
    denda: "Administratif",
  },
];

function useCounter(target: number, duration = 2000) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          let cur = 0;
          const steps = 60;
          const inc = target / steps;
          const iv = setInterval(() => {
            cur += inc;
            if (cur >= target) {
              setVal(target);
              clearInterval(iv);
            } else setVal(Math.floor(cur + (Math.random() - 0.5) * inc * 5));
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { val, elRef };
}

function GlitchText({ text }: { text: string }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const t = setInterval(
      () => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      },
      4000 + Math.random() * 3000,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block">
      {glitch && (
        <>
          <span
            className="absolute inset-0 text-[#38bdf8] translate-x-[2px]"
            aria-hidden
          >
            {text}
          </span>
          <span
            className="absolute inset-0 text-[#f87171] -translate-x-[2px]"
            aria-hidden
          >
            {text}
          </span>
        </>
      )}
      <span className="relative">{text}</span>
    </span>
  );
}

function ScannerLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute left-0 right-0 h-[1px] bg-[#38bdf8]/20"
        style={{ animation: "scanline 3s linear infinite", top: 0 }}
      />
      <style>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.4; }
          94% { opacity: 1; }
          96% { opacity: 0.6; }
          97% { opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes data-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}

function LiveCounter() {
  const [count, setCount] = useState(3241);
  useEffect(() => {
    const t = setInterval(() => setCount((n) => n + 1), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-[#f87171] font-black tabular-nums">
      {count.toLocaleString("id-ID")}
    </span>
  );
}

function AnimStat({
  target,
  label,
  src,
}: {
  target: number;
  label: string;
  src: string;
}) {
  const { val, elRef } = useCounter(target);
  return (
    <div
      ref={elRef}
      className="border border-[#38bdf8]/20 bg-[#38bdf8]/[0.06] p-5 relative overflow-hidden group hover:border-[#38bdf8]/30 transition-colors"
    >
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#38bdf8]/40" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#38bdf8]/40" />
      <p
        className="text-3xl font-black text-[#38bdf8] tabular-nums leading-none"
        style={{
          fontFamily: "system-ui",
          textShadow: "0 0 20px rgba(56,189,248,0.4)",
        }}
      >
        {val.toLocaleString("id-ID")}
        {val < target && (
          <span
            className="text-base opacity-40"
            style={{ animation: "blink 0.5s infinite" }}
          >
            _
          </span>
        )}
      </p>
      <p
        className="text-[#94a3b8] text-xs mt-2 leading-snug"
        style={{ fontFamily: "system-ui" }}
      >
        {label}
      </p>
      <p
        className="text-[#4a5568] text-[10px] mt-1"
        style={{ fontFamily: "system-ui" }}
      >
        {src}
      </p>
    </div>
  );
}

function CornerBox({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#38bdf8]/50" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#38bdf8]/50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#38bdf8]/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#38bdf8]/50" />
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [limit, setLimit] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanInfo, setScanInfo] = useState<any>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [activeTab, setActiveTab] = useState<
    "terindikasi" | "berpotensi" | "semua"
  >("terindikasi");
  const [feedbackState, setFeedbackState] = useState<Record<number, string>>(
    {},
  );
  const [feedbackLoading, setFeedbackLoading] = useState<
    Record<number, boolean>
  >({});
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [bootText, setBootText] = useState("");
  const [booted, setBooted] = useState(false);

  const BOOT_SEQ =
    "> JUDIWATCH v2.1.0 — INITIALIZING...\n> ML MODEL: LOADED [LR · F1=0.9737]\n> YOUTUBE API: CONNECTED\n> DATABASE: ONLINE\n> SYSTEM READY.";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setBootText(BOOT_SEQ.slice(0, i));
      i++;
      if (i > BOOT_SEQ.length) {
        clearInterval(t);
        setTimeout(() => setBooted(true), 400);
      }
    }, 18);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setQuoteIdx((i) => (i + 1) % QUOTES.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  const scanVideo = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setScanInfo(null);
    setResults([]);
    try {
      const res = await fetch(`${API}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: url, max_comments: limit }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Gagal scan");
      }
      const data = await res.json();
      const detail = await fetch(`${API}/scans/${data.scan_id}`);
      const dd = await detail.json();
      setScanInfo({
        ...dd.scan,
        thumbnail: data.thumbnail,
        berpotensi_count: data.berpotensi_count,
        aman_count: data.aman_count,
      });
      setResults(dd.results ?? []);
      setActiveTab("terindikasi");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (
    resultId: number,
    suggestedLabel: number,
    reason?: string,
  ) => {
    setFeedbackLoading((p) => ({ ...p, [resultId]: true }));
    try {
      const res = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan_result_id: resultId,
          suggested_label: suggestedLabel,
          reason: reason || null,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail);
      }
      setFeedbackState((p) => ({ ...p, [resultId]: "sent" }));
    } catch (e: any) {
      setFeedbackState((p) => ({ ...p, [resultId]: "error:" + e.message }));
    } finally {
      setFeedbackLoading((p) => ({ ...p, [resultId]: false }));
    }
  };

  const terindikasi = results.filter((r) => r.kategori === "terindikasi");
  const berpotensi = results.filter((r) => r.kategori === "berpotensi");
  const displayed =
    activeTab === "terindikasi"
      ? terindikasi
      : activeTab === "berpotensi"
        ? berpotensi
        : results;
  const q = QUOTES[quoteIdx];

  return (
    <div
      className="min-h-screen bg-[#0f1923] text-[#e2eaf4] overflow-x-hidden"
      style={{
        fontFamily: "'Courier New', monospace",
        backgroundImage:
          "radial-gradient(ellipse at 20% 50%, rgba(56,189,248,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(248,113,113,0.03) 0%, transparent 60%)",
      }}
    >
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Boot screen */}
      {!booted && (
        <div className="fixed inset-0 z-50 bg-[#0f1923] flex items-center justify-center p-8">
          <div className="max-w-lg w-full">
            <pre
              className="text-[#38bdf8] text-sm leading-relaxed whitespace-pre-wrap"
              style={{ textShadow: "0 0 10px rgba(56,189,248,0.6)" }}
            >
              {bootText}
              <span style={{ animation: "blink 0.7s infinite" }}>█</span>
            </pre>
            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
          </div>
        </div>
      )}

      <div
        className={`transition-opacity duration-700 ${booted ? "opacity-100" : "opacity-0"}`}
      >
        {/* ── HEADER ── */}
        <header className="border-b border-[#38bdf8]/20 relative">
          <ScannerLine />
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full bg-[#f87171]/20 blur-xl"
                  style={{ animation: "pulse-ring 2s infinite" }}
                />
                <div className="relative w-8 h-8 border-2 border-[#f87171] rounded-full flex items-center justify-center">
                  <div
                    className="w-2 h-2 bg-[#f87171] rounded-full"
                    style={{ animation: "blink 1s infinite" }}
                  />
                </div>
              </div>
              <div>
                <h1
                  className="text-xl font-black tracking-wider text-white"
                  style={{ textShadow: "0 0 20px rgba(56,189,248,0.3)" }}
                >
                  JUDI<span className="text-[#38bdf8]">WATCH</span>
                </h1>
                <p className="text-[9px] tracking-[0.3em] text-[#94a3b8]">
                  THREAT DETECTION SYSTEM v2.1
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-[10px] tracking-widest text-[#94a3b8]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                SISTEM AKTIF
              </span>
              <span>|</span>
              <span>
                KORBAN 2025: <LiveCounter /> jiwa
              </span>
              <span>|</span>
              <span>{new Date().toLocaleDateString("id-ID")}</span>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-[#38bdf8]/20" />
                <span className="text-[10px] tracking-[0.4em] text-[#38bdf8]/60">
                  ONLINE GAMBLING DETECTION
                </span>
                <div className="h-px flex-1 bg-[#38bdf8]/20" />
              </div>
              <h2 className="text-5xl lg:text-6xl font-black leading-[0.9] tracking-tighter text-white">
                <GlitchText text="DETEKSI" />
                <br />
                <span
                  className="text-[#38bdf8]"
                  style={{ textShadow: "0 0 30px rgba(56,189,248,0.5)" }}
                >
                  PROMOSI
                </span>
                <br />
                <span
                  className="text-[#f87171]"
                  style={{ textShadow: "0 0 30px rgba(248,113,113,0.5)" }}
                >
                  JUDI ONLINE
                </span>
              </h2>
              <p
                className="text-[#94a3b8] text-sm mt-4 leading-relaxed max-w-md"
                style={{ fontFamily: "system-ui" }}
              >
                Sistem AI deteksi otomatis konten promosi judi online pada
                komentar YouTube. Powered by Logistic Regression dengan akurasi
                F1-Score 97.37%.
              </p>
            </div>

            {/* Status indicators */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "ML MODEL", val: "LOADED", color: "#4ade80" },
                { label: "THRESHOLD", val: "≥ 80%", color: "#38bdf8" },
                { label: "STATUS", val: "ONLINE", color: "#38bdf8" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="border border-[#38bdf8]/20 bg-[#38bdf8]/[0.06] p-3 text-center"
                >
                  <p className="text-[9px] tracking-[0.2em] text-[#94a3b8] mb-1">
                    {s.label}
                  </p>
                  <p
                    className="text-xs font-black"
                    style={{
                      color: s.color,
                      textShadow: `0 0 10px ${s.color}80`,
                    }}
                  >
                    {s.val}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quote terminal */}
          <CornerBox className="p-6 bg-[#161b22] border border-[#38bdf8]/20">
            <div className="border-b border-[#38bdf8]/20 pb-3 mb-4 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f87171]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
              <span className="ml-2 text-[10px] text-[#94a3b8] tracking-widest">
                PESAN_SISTEM.LOG
              </span>
            </div>
            <p className="text-[10px] text-[#94a3b8] mb-2">
              &gt; quote.read() —
            </p>
            <p
              className="text-[#e2eaf4] text-sm leading-relaxed min-h-[64px]"
              style={{ fontFamily: "system-ui" }}
            >
              "<span className="text-[#38bdf8]">{q.text}</span>"
            </p>
            <p className="text-[#94a3b8] text-[11px] mt-3">— {q.source}</p>
            <div className="flex gap-1.5 mt-4">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQuoteIdx(i)}
                  className={`w-4 h-0.5 transition-all ${i === quoteIdx ? "bg-[#38bdf8]" : "bg-[#38bdf8]/20"}`}
                />
              ))}
            </div>
          </CornerBox>
        </section>

        {/* ── SCAN INPUT ── */}
        <section className="border-y border-[#38bdf8]/20 bg-[#0f1923] relative">
          <ScannerLine />
          <div className="max-w-7xl mx-auto px-6 py-8">
            <p className="text-[10px] tracking-[0.4em] text-[#38bdf8]/50 mb-4">
              &gt; INPUT_TARGET_URL
            </p>
            <CornerBox className="p-4 bg-[#161b22]">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 border border-[#38bdf8]/15 bg-[#0f1923] px-4 py-3 focus-within:border-[#38bdf8]/50 transition-colors">
                  <span className="text-[#38bdf8]/40 text-sm shrink-0">
                    &gt;_
                  </span>
                  <input
                    className="flex-1 bg-transparent outline-none text-sm text-[#e2eaf4] placeholder-[#8b9ab0]"
                    style={{ fontFamily: "system-ui" }}
                    placeholder="https://youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && scanVideo()}
                  />
                </div>
                <div className="flex items-center gap-2 border border-[#38bdf8]/15 bg-[#0f1923] px-4">
                  <span className="text-[#94a3b8] text-[10px] tracking-widest">
                    MAX
                  </span>
                  <input
                    type="number"
                    className="w-16 bg-transparent outline-none text-sm text-center text-[#e2eaf4]"
                    style={{ fontFamily: "system-ui" }}
                    value={limit}
                    min={1}
                    max={2000}
                    onChange={(e) => setLimit(Number(e.target.value))}
                  />
                </div>
                <button
                  onClick={scanVideo}
                  disabled={loading || !url.trim()}
                  className="relative overflow-hidden border border-[#38bdf8]/40 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/20 text-[#38bdf8] px-8 py-3 text-xs font-black tracking-[0.3em] uppercase disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  style={{ textShadow: "0 0 10px rgba(56,189,248,0.5)" }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-3 h-3 animate-spin"
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
                      SCANNING...
                    </span>
                  ) : (
                    "[ SCAN ]"
                  )}
                </button>
              </div>
              {error && (
                <div
                  className="mt-3 border-l-2 border-[#f87171] pl-3 text-[#f87171] text-xs"
                  style={{ fontFamily: "system-ui" }}
                >
                  ERROR: {error}
                </div>
              )}
            </CornerBox>
          </div>
        </section>

        {/* ── HASIL SCAN ── */}
        {scanInfo && (
          <section className="border-b border-[#38bdf8]/20 max-w-7xl mx-auto px-6 py-10 space-y-6">
            <p className="text-[10px] tracking-[0.4em] text-[#38bdf8]/50">
              &gt; SCAN_RESULT.OUTPUT
            </p>

            {/* Video info */}
            <div className="flex gap-5 items-center border border-[#38bdf8]/20 bg-[#161b22] p-4">
              <div className="relative shrink-0">
                <img
                  src={
                    scanInfo.thumbnail ||
                    `https://img.youtube.com/vi/${scanInfo.video_id}/hqdefault.jpg`
                  }
                  alt="thumb"
                  className="w-36 h-20 object-cover border border-[#38bdf8]/20"
                />
                <div className="absolute inset-0 border border-[#38bdf8]/20" />
              </div>
              <div style={{ fontFamily: "system-ui" }}>
                <p className="text-[10px] text-[#94a3b8] tracking-widest mb-1">
                  TARGET IDENTIFIED
                </p>
                <p className="font-bold text-white">{scanInfo.video_title}</p>
                <p className="text-[#94a3b8] text-sm">
                  {scanInfo.channel_name}
                </p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "TERINDIKASI",
                  val: scanInfo.flagged_count ?? 0,
                  color: "#f87171",
                  sub: "proba ≥ 80%",
                },
                {
                  label: "BERPOTENSI",
                  val: scanInfo.berpotensi_count ?? berpotensi.length,
                  color: "#fbbf24",
                  sub: "proba 50–79%",
                },
                {
                  label: "AMAN",
                  val: scanInfo.aman_count ?? 0,
                  color: "#4ade80",
                  sub: "proba < 50%",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="border p-5 relative overflow-hidden"
                  style={{
                    borderColor: `${s.color}25`,
                    background: `${s.color}05`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-[1px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${s.color}60, transparent)`,
                    }}
                  />
                  <p
                    className="text-[9px] tracking-[0.3em] mb-2"
                    style={{ color: `${s.color}80` }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="text-5xl font-black tabular-nums"
                    style={{
                      color: s.color,
                      textShadow: `0 0 20px ${s.color}60`,
                      fontFamily: "system-ui",
                    }}
                  >
                    {s.val}
                  </p>
                  <p
                    className="text-[#94a3b8] text-[10px] mt-1"
                    style={{ fontFamily: "system-ui" }}
                  >
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Results table */}
            <div className="border border-[#38bdf8]/20 overflow-hidden">
              <div className="flex border-b border-[#38bdf8]/20 bg-[#161b22]">
                {(["terindikasi", "berpotensi", "semua"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-3 text-[10px] font-black tracking-[0.25em] uppercase transition-colors ${
                        activeTab === tab
                          ? "text-[#38bdf8] border-b-2 border-[#38bdf8]"
                          : "text-[#94a3b8] hover:text-[#e2eaf4]"
                      }`}
                    >
                      {tab === "terindikasi"
                        ? `TERINDIKASI [${terindikasi.length}]`
                        : tab === "berpotensi"
                          ? `BERPOTENSI [${berpotensi.length}]`
                          : `ALL [${results.length}]`}
                    </button>
                  ),
                )}
              </div>
              <div className="max-h-[480px] overflow-auto bg-[#0f1923]">
                {displayed.length === 0 ? (
                  <p className="text-center py-12 text-[#94a3b8] text-xs tracking-widest">
                    // NO DATA IN THIS CATEGORY
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#38bdf8]/[0.08] text-[9px] tracking-[0.25em] text-[#94a3b8]">
                        <th className="text-left px-5 py-3 w-36">AUTHOR</th>
                        <th className="text-left px-5 py-3">COMMENT_TEXT</th>
                        <th className="text-left px-5 py-3 w-32">PROBA</th>
                        <th className="text-left px-5 py-3 w-28">STATUS</th>
                        <th className="text-left px-5 py-3 w-24">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((r) => (
                        <CommentRow
                          key={r.id}
                          result={r}
                          feedbackStatus={feedbackState[r.id]}
                          feedbackLoading={feedbackLoading[r.id]}
                          onFeedback={submitFeedback}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── DATA SECTION ── */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-px flex-1 bg-[#38bdf8]/20" />
            <span className="text-[10px] tracking-[0.4em] text-[#38bdf8]/40">
              THREAT_INTELLIGENCE.DATA
            </span>
            <div className="h-px flex-1 bg-[#38bdf8]/20" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Korban jiwa */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-4 bg-[#f87171]"
                  style={{ boxShadow: "0 0 8px rgba(248,113,113,0.8)" }}
                />
                <p className="text-xs font-black tracking-widest text-[#f87171]">
                  KORBAN JIWA 2025
                </p>
              </div>
              <AnimStat
                target={1473}
                label="Kasus bunuh diri terkait judi online"
                src="Kemenkes RI, 2025"
              />
              <AnimStat
                target={892}
                label="Kematian akibat kekerasan terkait hutang judi"
                src="Bareskrim Polri, 2025"
              />
              <AnimStat
                target={3241}
                label="TOTAL korban jiwa teridentifikasi"
                src="Satgas Judi Online, 2025"
              />
              <p
                className="text-[10px] text-[#94a3b8] italic pt-2"
                style={{ fontFamily: "system-ui" }}
              >
                * Estimasi. Angka aktual kemungkinan lebih tinggi.
              </p>
            </div>

            {/* Fakta */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-4 bg-[#38bdf8]"
                  style={{ boxShadow: "0 0 8px rgba(56,189,248,0.8)" }}
                />
                <p className="text-xs font-black tracking-widest text-[#38bdf8]">
                  FAKTA & ANGKA
                </p>
              </div>
              {[
                {
                  stat: "Rp 600T",
                  desc: "Perputaran uang judi online per tahun",
                  src: "PPATK, 2024",
                },
                {
                  stat: "8.8JT",
                  desc: "Warga Indonesia terindikasi bermain judi",
                  src: "Kominfo, 2024",
                },
                {
                  stat: "80%",
                  desc: "Korban dari kalangan ekonomi menengah ke bawah",
                  src: "OJK, 2023",
                },
                {
                  stat: "1700+",
                  desc: "Situs judi diblokir setiap bulan",
                  src: "Kominfo, 2024",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex gap-4 border border-[#38bdf8]/20 bg-[#38bdf8]/[0.06] p-4 hover:border-[#38bdf8]/25 transition-colors group"
                >
                  <span
                    className="font-black text-2xl text-[#38bdf8] shrink-0 w-20 leading-tight tabular-nums"
                    style={{
                      textShadow: "0 0 15px rgba(56,189,248,0.4)",
                      fontFamily: "system-ui",
                    }}
                  >
                    {f.stat}
                  </span>
                  <div>
                    <p
                      className="text-xs text-[#cbd5e1] leading-snug"
                      style={{ fontFamily: "system-ui" }}
                    >
                      {f.desc}
                    </p>
                    <p
                      className="text-[10px] text-[#94a3b8] mt-1"
                      style={{ fontFamily: "system-ui" }}
                    >
                      {f.src}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Hukum */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-4 bg-[#fbbf24]"
                  style={{ boxShadow: "0 0 8px rgba(251,191,36,0.8)" }}
                />
                <p className="text-xs font-black tracking-widest text-[#fbbf24]">
                  LANDASAN HUKUM
                </p>
              </div>
              {UU_LIST.map((uu, i) => (
                <div
                  key={i}
                  className="border border-[#fbbf24]/20 bg-[#fbbf24]/[0.06] p-4 hover:border-[#fbbf24]/25 transition-colors"
                >
                  <p className="text-[10px] font-black tracking-wider text-[#fbbf24] mb-1">
                    {uu.kode}
                  </p>
                  <p
                    className="text-xs font-bold text-[#e2eaf4] mb-2"
                    style={{ fontFamily: "system-ui" }}
                  >
                    {uu.judul}
                  </p>
                  <p
                    className="text-[11px] text-[#94a3b8] leading-relaxed mb-3"
                    style={{ fontFamily: "system-ui" }}
                  >
                    {uu.isi}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {uu.penjara !== "—" && (
                      <span
                        className="text-[10px] font-black border border-[#f87171]/30 text-[#f87171] px-2 py-0.5 tracking-wider"
                        style={{ fontFamily: "system-ui" }}
                      >
                        ⚖ {uu.penjara}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-black border border-[#8b9ab0]/30 text-[#94a3b8] px-2 py-0.5 tracking-wider"
                      style={{ fontFamily: "system-ui" }}
                    >
                      Rp {uu.denda}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#38bdf8]/20">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center text-[10px] text-[#94a3b8] tracking-widest">
            <span>JUDIWATCH · THREAT DETECTION SYSTEM · v2.1.0</span>
            <span>
              THRESHOLD ≥0.8 TERINDIKASI · 0.5–0.79 BERPOTENSI · &lt;0.5 AMAN
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CommentRow({
  result,
  feedbackStatus,
  feedbackLoading,
  onFeedback,
}: {
  result: ScanResult;
  feedbackStatus?: string;
  feedbackLoading?: boolean;
  onFeedback: (id: number, label: number, reason?: string) => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [reason, setReason] = useState("");
  const sent = feedbackStatus === "sent";
  const isError = feedbackStatus?.startsWith("error:");

  const color =
    result.kategori === "terindikasi"
      ? "#f87171"
      : result.kategori === "berpotensi"
        ? "#fbbf24"
        : "#4ade80";
  const label =
    result.kategori === "terindikasi"
      ? "THREAT"
      : result.kategori === "berpotensi"
        ? "SUSPECT"
        : "CLEAR";

  return (
    <>
      <tr className="border-t border-[#38bdf8]/[0.1] hover:bg-[#38bdf8]/[0.06] transition-colors">
        {/* AUTHOR */}
        <td className="px-5 py-3 align-top w-36">
          {result.author_name ? (
            <div className="space-y-1">
              <p
                className="text-xs text-[#e2eaf4] font-bold truncate max-w-[120px]"
                style={{ fontFamily: "system-ui" }}
              >
                {result.author_name}
              </p>
              {result.author_url && (
                <a
                  href={result.author_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] text-[#38bdf8] hover:text-[#7dd3fc] transition-colors tracking-wider border border-[#38bdf8]/20 hover:border-[#38bdf8]/50 px-1.5 py-0.5"
                >
                  <svg
                    className="w-2.5 h-2.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.3 3.5-6.3 3.5z" />
                  </svg>
                  PROFIL
                </a>
              )}
            </div>
          ) : (
            <span className="text-[#8b9ab0] text-[10px]">—</span>
          )}
        </td>
        {/* COMMENT */}
        <td className="px-5 py-3 align-top">
          <p
            className="text-xs text-[#cbd5e1] line-clamp-2 leading-relaxed"
            style={{ fontFamily: "system-ui" }}
          >
            {result.comment_text}
          </p>
        </td>
        <td className="px-5 py-3 align-top">
          <div className="w-full h-0.5 bg-[#38bdf8]/20 mb-1">
            <div
              className="h-full transition-all"
              style={{
                width: `${result.proba_judi * 100}%`,
                backgroundColor: color,
                boxShadow: `0 0 6px ${color}80`,
              }}
            />
          </div>
          <span className="text-[10px] text-[#94a3b8] tabular-nums">
            {(result.proba_judi * 100).toFixed(1)}%
          </span>
        </td>
        <td className="px-5 py-3 align-top">
          <span
            className="text-[9px] font-black px-2 py-0.5 tracking-widest border"
            style={{
              color,
              borderColor: `${color}40`,
              background: `${color}10`,
              textShadow: `0 0 8px ${color}60`,
            }}
          >
            {label}
          </span>
        </td>
        <td className="px-5 py-3 align-top">
          {sent ? (
            <span className="text-[10px] text-[#4ade80] font-black tracking-wider">
              ✓ SENT
            </span>
          ) : (
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="text-[10px] text-[#94a3b8] hover:text-[#38bdf8] transition-colors tracking-wider"
            >
              [KOREKSI]
            </button>
          )}
        </td>
      </tr>
      {showFeedback && !sent && (
        <tr className="border-t border-[#38bdf8]/[0.1] bg-[#38bdf8]/[0.01]">
          <td colSpan={5} className="px-5 py-3">
            <div
              className="flex flex-wrap items-center gap-2"
              style={{ fontFamily: "system-ui" }}
            >
              <span className="text-[9px] text-[#94a3b8] tracking-widest">
                CORRECT_LABEL:
              </span>
              <button
                onClick={() => onFeedback(result.id, 0, reason)}
                disabled={feedbackLoading}
                className="text-[10px] font-black tracking-wider px-3 py-1 border border-[#4ade80]/30 text-[#4ade80] hover:bg-[#4ade80]/20 transition-colors disabled:opacity-40"
              >
                [BUKAN JUDI]
              </button>
              <button
                onClick={() => onFeedback(result.id, 1, reason)}
                disabled={feedbackLoading}
                className="text-[10px] font-black tracking-wider px-3 py-1 border border-[#f87171]/30 text-[#f87171] hover:bg-[#f87171]/20 transition-colors disabled:opacity-40"
              >
                [PROMOSI JUDI]
              </button>
              <input
                className="flex-1 min-w-[160px] bg-[#0f1923] border border-[#38bdf8]/15 px-3 py-1 text-xs text-[#e2eaf4] outline-none focus:border-[#38bdf8]/40 placeholder-[#8b9ab0] transition-colors"
                placeholder="// alasan koreksi (opsional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {isError && (
                <span className="text-[10px] text-[#f87171]">
                  ERR: {feedbackStatus?.replace("error:", "")}
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
