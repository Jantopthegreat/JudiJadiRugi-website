"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
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
    <span className="text-[#38bdf8] tabular-nums font-black">
      {count.toLocaleString("id-ID")}
    </span>
  );
}

const STEPS = [
  {
    no: "01",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
        />
      </svg>
    ),
    title: "Paste Link Video",
    desc: "Salin URL video YouTube yang ingin kamu periksa dan tempelkan pada kolom yang tersedia di halaman scan.",
  },
  {
    no: "02",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.309 48.309 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
        />
      </svg>
    ),
    title: "Sistem Memindai",
    desc: "Sistem secara otomatis mengambil komentar dari video melalui YouTube API, lalu setiap komentar dianalisis menggunakan model machine learning.",
  },
  {
    no: "03",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
    ),
    title: "Lihat Hasil Deteksi",
    desc: "Hasil ditampilkan dengan tiga kategori: Terindikasi (≥80%), Berpotensi (50–79%), dan Aman (<50%), lengkap dengan nama akun dan probabilitas.",
  },
  {
    no: "04",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
    ),
    title: "Koreksi Jika Salah",
    desc: "Jika ada komentar yang salah terdeteksi, kamu bisa memberikan koreksi label. Masukan ini akan membantu meningkatkan akurasi sistem ke depannya.",
  },
];

const CATEGORIES = [
  {
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.25)",
    label: "TERINDIKASI",
    range: "Probabilitas ≥ 80%",
    desc: "Komentar sangat kemungkinan besar merupakan promosi judi online. Model memiliki keyakinan tinggi berdasarkan pola kata yang terdeteksi.",
    example: '"Daftar sekarang bonus 100% new member, ID: RAJA88"',
  },
  {
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
    label: "BERPOTENSI",
    range: "Probabilitas 50–79%",
    desc: "Komentar mengandung pola yang mencurigakan namun model belum sepenuhnya yakin. Perlu verifikasi manual lebih lanjut.",
    example: '"Menang terus di sini bang, coba aja dulu"',
  },
  {
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.25)",
    label: "AMAN",
    range: "Probabilitas < 50%",
    desc: "Komentar tidak terindikasi sebagai promosi judi online. Tidak disimpan ke database untuk efisiensi sistem.",
    example: '"Kontennya bagus banget, lanjutkan terus kak!"',
  },
];

const FAQS = [
  {
    q: "Apakah saya perlu membuat akun untuk menggunakan sistem ini?",
    a: "Tidak. Sistem ini dapat digunakan langsung tanpa registrasi atau login. Cukup paste link video YouTube dan klik Pindai.",
  },
  {
    q: "Berapa banyak komentar yang bisa dipindai sekaligus?",
    a: "Sistem mendukung pemindaian hingga 2.000 komentar per scan. Default-nya adalah 300 komentar, namun dapat disesuaikan sesuai kebutuhan.",
  },
  {
    q: "Apa yang dimaksud dengan fitur koreksi label?",
    a: "Model machine learning tidak selalu sempurna. Jika kamu menemukan komentar yang salah terdeteksi, kamu bisa memberikan koreksi. Masukan ini akan direview oleh admin dan digunakan untuk meningkatkan akurasi model di masa mendatang.",
  },
  {
    q: "Apakah semua komentar disimpan ke database?",
    a: "Tidak. Hanya komentar yang memiliki probabilitas ≥ 50% (berpotensi dan terindikasi) yang disimpan. Komentar yang aman tidak disimpan untuk menjaga efisiensi storage.",
  },
  {
    q: "Seberapa akurat sistem ini?",
    a: "Model Logistic Regression yang digunakan mencapai akurasi 97,85% dengan F1-Score 97,37% pada data uji. Namun akurasi dapat bervariasi tergantung karakteristik komentar di video yang dipindai.",
  },
  {
    q: "Apakah sistem ini bisa mendeteksi semua jenis promosi judi?",
    a: "Sistem dilatih menggunakan dataset komentar judi dari YouTube Indonesia. Model paling efektif untuk mendeteksi pola promosi judi berbahasa Indonesia, namun mungkin kurang akurat untuk konten berbahasa lain atau pola baru yang belum ada di data training.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0d1117] text-[#e2eaf4] overflow-x-hidden"
      style={{
        fontFamily: "'Courier New', monospace",
        backgroundImage:
          "radial-gradient(ellipse at 20% 10%, rgba(56,189,248,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(248,113,113,0.04) 0%, transparent 50%)",
      }}
    >
      {/* Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0d1117]/90 border-b border-[#38bdf8]/10 backdrop-blur-md" : ""}`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-7 h-7 border-2 border-[#f87171] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#f87171] rounded-full animate-pulse" />
              </div>
            </div>
            <span className="font-black text-lg tracking-wider">
              JUDI<span className="text-[#38bdf8]">WATCH</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#cara-kerja"
              className="hidden sm:block text-[11px] tracking-widest uppercase text-[#8b9ab0] hover:text-[#e2eaf4] transition-colors"
            >
              Cara Kerja
            </a>
            <a
              href="#kategori"
              className="hidden sm:block text-[11px] tracking-widest uppercase text-[#8b9ab0] hover:text-[#e2eaf4] transition-colors"
            >
              Kategori
            </a>
            <a
              href="#faq"
              className="hidden sm:block text-[11px] tracking-widest uppercase text-[#8b9ab0] hover:text-[#e2eaf4] transition-colors"
            >
              FAQ
            </a>
            <Link
              href="/scan"
              className="border border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8] px-4 py-2 text-[11px] font-black tracking-widest uppercase hover:bg-[#38bdf8]/20 transition-colors"
            >
              Mulai Scan →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen flex items-center relative pt-20">
        <div className="max-w-6xl mx-auto px-6 py-20 w-full">
          <div className="max-w-3xl">
            <div
              className="flex items-center gap-2 mb-6 opacity-0 animate-[fadeIn_0.6s_ease_0.2s_forwards]"
              style={{ ["--tw-translate-y" as any]: "0" }}
            >
              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              <span className="text-[10px] tracking-[0.4em] uppercase text-[#4ade80]/80">
                Sistem Aktif · Indonesia
              </span>
            </div>

            <h1
              className="text-5xl sm:text-7xl font-black leading-[0.9] tracking-tighter mb-6"
              style={{ animation: "fadeIn 0.6s ease 0.3s both" }}
            >
              Deteksi
              <br />
              <span
                className="text-[#38bdf8]"
                style={{ textShadow: "0 0 40px rgba(56,189,248,0.3)" }}
              >
                Promosi
              </span>
              <br />
              <span
                className="text-[#f87171]"
                style={{ textShadow: "0 0 40px rgba(248,113,113,0.3)" }}
              >
                Judi Online
              </span>
            </h1>

            <p
              className="text-[#8b9ab0] text-base leading-relaxed max-w-xl mb-8"
              style={{
                fontFamily: "system-ui",
                animation: "fadeIn 0.6s ease 0.4s both",
              }}
            >
              Sistem deteksi otomatis komentar promosi judi online pada YouTube
              menggunakan machine learning. Gratis, tanpa akun, langsung pakai.
            </p>

            <div
              className="flex flex-wrap gap-3 mb-12"
              style={{ animation: "fadeIn 0.6s ease 0.5s both" }}
            >
              <Link
                href="/scan"
                className="bg-[#38bdf8] text-[#0d1117] px-8 py-3 text-sm font-black tracking-widest uppercase hover:bg-[#7dd3fc] transition-colors"
              >
                [ MULAI SCAN ]
              </Link>
              <a
                href="#cara-kerja"
                className="border border-[#38bdf8]/30 text-[#38bdf8] px-8 py-3 text-sm font-black tracking-widest uppercase hover:bg-[#38bdf8]/10 transition-colors"
              >
                PELAJARI LEBIH →
              </a>
            </div>

            {/* Stats row */}
            <div
              className="flex flex-wrap gap-8 pt-8 border-t border-[#38bdf8]/10"
              style={{ animation: "fadeIn 0.6s ease 0.6s both" }}
            >
              {[
                { val: "97.85%", label: "Akurasi Model" },
                { val: "10.230", label: "Data Training" },
                { val: <LiveCounter />, label: "Korban Jiwa 2025" },
              ].map((s, i) => (
                <div key={i}>
                  <p
                    className="text-2xl font-black text-[#e2eaf4]"
                    style={{ fontFamily: "system-ui" }}
                  >
                    {s.val}
                  </p>
                  <p
                    className="text-[10px] text-[#8b9ab0] tracking-widest uppercase mt-0.5"
                    style={{ fontFamily: "system-ui" }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-[9px] tracking-[0.3em] uppercase text-[#8b9ab0]">
            Scroll
          </span>
          <div className="w-px h-8 bg-[#38bdf8]/40 animate-pulse" />
        </div>
      </section>

      {/* ── CARA KERJA ── */}
      <section id="cara-kerja" className="py-24 border-t border-[#38bdf8]/10">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-1 h-5 bg-[#38bdf8]"
                style={{ boxShadow: "0 0 8px rgba(56,189,248,0.8)" }}
              />
              <p
                className="text-[10px] tracking-[0.4em] uppercase text-[#38bdf8]"
                style={{ fontFamily: "system-ui" }}
              >
                Panduan Penggunaan
              </p>
            </div>
            <h2 className="text-3xl font-black mb-2">
              Cara Menggunakan
              <br />
              JudiJadiRugi
            </h2>
            <p
              className="text-[#8b9ab0] text-sm max-w-lg"
              style={{ fontFamily: "system-ui" }}
            >
              Empat langkah mudah untuk memindai komentar YouTube dan mendeteksi
              promosi judi online.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="border border-[#38bdf8]/15 bg-[#38bdf8]/[0.03] p-6 hover:border-[#38bdf8]/35 transition-colors relative group h-full">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#38bdf8]/40" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#38bdf8]/40" />

                  <div className="flex items-start justify-between mb-4">
                    <div className="text-[#38bdf8] opacity-70 group-hover:opacity-100 transition-opacity">
                      {s.icon}
                    </div>
                    <span
                      className="text-[#38bdf8]/20 text-3xl font-black"
                      style={{ fontFamily: "system-ui" }}
                    >
                      {s.no}
                    </span>
                  </div>
                  <h3 className="font-black text-[#e2eaf4] mb-2">{s.title}</h3>
                  <p
                    className="text-[#8b9ab0] text-xs leading-relaxed"
                    style={{ fontFamily: "system-ui" }}
                  >
                    {s.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* CTA */}
          <FadeIn delay={0.4}>
            <div className="mt-10 text-center">
              <Link
                href="/scan"
                className="inline-block border border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8] px-10 py-3 text-xs font-black tracking-[0.3em] uppercase hover:bg-[#38bdf8]/20 transition-colors"
              >
                COBA SEKARANG →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── KATEGORI ── */}
      <section id="kategori" className="py-24 border-t border-[#38bdf8]/10">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-1 h-5 bg-[#fbbf24]"
                style={{ boxShadow: "0 0 8px rgba(251,191,36,0.8)" }}
              />
              <p
                className="text-[10px] tracking-[0.4em] uppercase text-[#fbbf24]"
                style={{ fontFamily: "system-ui" }}
              >
                Sistem Klasifikasi
              </p>
            </div>
            <h2 className="text-3xl font-black mb-2">
              Kategori Hasil
              <br />
              Deteksi
            </h2>
            <p
              className="text-[#8b9ab0] text-sm max-w-lg"
              style={{ fontFamily: "system-ui" }}
            >
              Setiap komentar dikategorikan berdasarkan nilai probabilitas yang
              dihasilkan model machine learning.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            {CATEGORIES.map((c, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div
                  className="border p-6 h-full relative overflow-hidden group hover:scale-[1.01] transition-transform"
                  style={{ borderColor: c.border, background: c.bg }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${c.color}, transparent)`,
                    }}
                  />

                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-xs font-black tracking-widest px-2 py-0.5 border"
                      style={{
                        color: c.color,
                        borderColor: `${c.color}40`,
                        background: `${c.color}10`,
                        fontFamily: "system-ui",
                      }}
                    >
                      {c.label}
                    </span>
                    <span
                      className="text-[10px] tracking-wider"
                      style={{ color: `${c.color}80`, fontFamily: "system-ui" }}
                    >
                      {c.range}
                    </span>
                  </div>

                  <p
                    className="text-[#cbd5e1] text-sm leading-relaxed mb-4"
                    style={{ fontFamily: "system-ui" }}
                  >
                    {c.desc}
                  </p>

                  <div
                    className="border-t pt-4"
                    style={{ borderColor: `${c.color}20` }}
                  >
                    <p
                      className="text-[10px] tracking-wider mb-1"
                      style={{ color: `${c.color}60`, fontFamily: "system-ui" }}
                    >
                      CONTOH KOMENTAR:
                    </p>
                    <p
                      className="text-xs italic"
                      style={{ color: `${c.color}90`, fontFamily: "system-ui" }}
                    >
                      {c.example}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── KOREKSI LABEL ── */}
      <section className="py-24 border-t border-[#38bdf8]/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-1 h-5 bg-[#4ade80]"
                    style={{ boxShadow: "0 0 8px rgba(74,222,128,0.8)" }}
                  />
                  <p
                    className="text-[10px] tracking-[0.4em] uppercase text-[#4ade80]"
                    style={{ fontFamily: "system-ui" }}
                  >
                    Fitur Koreksi
                  </p>
                </div>
                <h2 className="text-3xl font-black mb-4">
                  Model Tidak Sempurna?
                  <br />
                  Kamu Bisa Bantu!
                </h2>
                <p
                  className="text-[#8b9ab0] text-sm leading-relaxed mb-6"
                  style={{ fontFamily: "system-ui" }}
                >
                  Tidak ada model machine learning yang sempurna 100%. Terkadang
                  sistem bisa salah mengklasifikasikan komentar — itulah mengapa
                  kami menyediakan fitur koreksi label.
                </p>
                <div className="space-y-4">
                  {[
                    {
                      icon: "→",
                      title: "Temukan Komentar yang Salah",
                      desc: "Saat melihat hasil scan, identifikasi komentar yang menurutmu salah terdeteksi.",
                    },
                    {
                      icon: "→",
                      title: "Klik Koreksi",
                      desc: "Tekan tombol [KOREKSI] pada baris komentar tersebut untuk membuka form koreksi.",
                    },
                    {
                      icon: "→",
                      title: "Pilih Label yang Benar",
                      desc: "Pilih apakah komentar tersebut seharusnya 'Bukan Judi' atau 'Promosi Judi', lalu tambahkan alasan jika perlu.",
                    },
                    {
                      icon: "→",
                      title: "Masukan Diproses Admin",
                      desc: "Koreksimu akan direview oleh admin. Jika disetujui, data ini akan membantu meningkatkan akurasi model.",
                    },
                  ].map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <span
                        className="text-[#4ade80] font-black shrink-0 mt-0.5"
                        style={{ fontFamily: "system-ui" }}
                      >
                        {s.icon}
                      </span>
                      <div>
                        <p
                          className="text-sm font-bold text-[#e2eaf4]"
                          style={{ fontFamily: "system-ui" }}
                        >
                          {s.title}
                        </p>
                        <p
                          className="text-xs text-[#8b9ab0] leading-relaxed mt-0.5"
                          style={{ fontFamily: "system-ui" }}
                        >
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Ilustrasi mockup koreksi */}
            <FadeIn delay={0.2}>
              <div className="border border-[#38bdf8]/15 bg-[#161b22] overflow-hidden">
                {/* Header mockup */}
                <div className="border-b border-[#38bdf8]/10 px-4 py-2.5 flex items-center gap-2 bg-[#0d1117]">
                  <div className="w-2 h-2 rounded-full bg-[#f87171]" />
                  <div className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                  <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                  <span className="text-[10px] text-[#8b9ab0] ml-2 tracking-widest">
                    HASIL_DETEKSI.VIEW
                  </span>
                </div>

                {/* Mockup row normal */}
                <div className="px-4 py-3 border-b border-[#38bdf8]/[0.06] flex items-center gap-3">
                  <div className="flex-1">
                    <p
                      className="text-xs text-[#8b9ab0]"
                      style={{ fontFamily: "system-ui" }}
                    >
                      Kontennya bagus banget kak!
                    </p>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-[9px] font-black px-1.5 py-0.5 border border-[#4ade80]/30 text-[#4ade80] bg-[#4ade80]/10">
                      CLEAR
                    </span>
                  </div>
                </div>

                {/* Mockup row terindikasi */}
                <div className="px-4 py-3 border-b border-[#38bdf8]/[0.06]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <p
                        className="text-xs text-[#e2eaf4]"
                        style={{ fontFamily: "system-ui" }}
                      >
                        bikin yang banyak lam
                      </p>
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.5 border border-[#f87171]/30 text-[#f87171] bg-[#f87171]/10">
                      THREAT
                    </span>
                    <button className="text-[9px] text-[#38bdf8] border border-[#38bdf8]/30 px-2 py-0.5 hover:bg-[#38bdf8]/10 transition-colors">
                      [KOREKSI]
                    </button>
                  </div>
                  {/* Form koreksi terbuka */}
                  <div className="bg-[#0d1117] border border-[#38bdf8]/10 p-3 mt-1">
                    <p
                      className="text-[9px] text-[#8b9ab0] mb-2 tracking-widest"
                      style={{ fontFamily: "system-ui" }}
                    >
                      CORRECT_LABEL:
                    </p>
                    <div className="flex gap-2 mb-2">
                      <button className="text-[9px] font-black px-2 py-1 border-2 border-[#4ade80] text-[#4ade80] bg-[#4ade80]/10">
                        [BUKAN JUDI] ✓
                      </button>
                      <button className="text-[9px] font-black px-2 py-1 border border-[#f87171]/30 text-[#f87171]/50">
                        [PROMOSI JUDI]
                      </button>
                    </div>
                    <div
                      className="border border-[#38bdf8]/15 px-2 py-1 text-[9px] text-[#8b9ab0]"
                      style={{ fontFamily: "system-ui" }}
                    >
                      // Komentar biasa, bukan promosi judi
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="px-4 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                  <p
                    className="text-[9px] text-[#4ade80] tracking-widest"
                    style={{ fontFamily: "system-ui" }}
                  >
                    Koreksi terkirim · Menunggu review admin
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 border-t border-[#38bdf8]/10">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-1 h-5 bg-[#f87171]"
                style={{ boxShadow: "0 0 8px rgba(248,113,113,0.8)" }}
              />
              <p
                className="text-[10px] tracking-[0.4em] uppercase text-[#f87171]"
                style={{ fontFamily: "system-ui" }}
              >
                FAQ
              </p>
            </div>
            <h2 className="text-3xl font-black mb-8">
              Pertanyaan yang
              <br />
              Sering Diajukan
            </h2>
          </FadeIn>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div
                  className={`border transition-colors ${openFaq === i ? "border-[#38bdf8]/30 bg-[#38bdf8]/[0.04]" : "border-[#38bdf8]/10 hover:border-[#38bdf8]/20"}`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                  >
                    <span
                      className="text-sm font-bold text-[#e2eaf4]"
                      style={{ fontFamily: "system-ui" }}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`text-[#38bdf8] text-lg font-black shrink-0 transition-transform ${openFaq === i ? "rotate-45" : ""}`}
                    >
                      +
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 border-t border-[#38bdf8]/10">
                      <p
                        className="text-sm text-[#8b9ab0] leading-relaxed pt-3"
                        style={{ fontFamily: "system-ui" }}
                      >
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="py-24 border-t border-[#38bdf8]/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <FadeIn>
            <p
              className="text-[10px] tracking-[0.4em] uppercase text-[#38bdf8]/60 mb-4"
              style={{ fontFamily: "system-ui" }}
            >
              Mulai Sekarang · Gratis · Tanpa Akun
            </p>
            <h2 className="text-4xl font-black mb-4">
              Periksa Video YouTube
              <br />
              <span className="text-[#38bdf8]">Kamu Sekarang</span>
            </h2>
            <p
              className="text-[#8b9ab0] text-sm mb-8 max-w-sm mx-auto"
              style={{ fontFamily: "system-ui" }}
            >
              Bantu jaga ruang digital Indonesia dari penyebaran promosi judi
              online.
            </p>
            <Link
              href="/scan"
              className="inline-block bg-[#38bdf8] text-[#0d1117] px-12 py-4 text-sm font-black tracking-[0.3em] uppercase hover:bg-[#7dd3fc] transition-colors"
            >
              [ MULAI SCAN SEKARANG ]
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#38bdf8]/10">
        <div
          className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-[#8b9ab0]/40 tracking-wider"
          style={{ fontFamily: "system-ui" }}
        >
          <span>JUDIJADIRUGI · Sistem Deteksi Konten Judi Online · v2.1.0</span>
          <span>
            Threshold ≥0.8 terindikasi · 0.5–0.79 berpotensi · &lt;0.5 aman
          </span>
        </div>
      </footer>
    </div>
  );
}
