"use client";
import { useState } from "react";

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [limit, setLimit] = useState(300);
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  const scanVideo = async () => {
    if (!url) return alert("Masukkan link YouTube");

    setLoading(true);

    const res = await fetch("http://localhost:8000/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_url: url,
        max_comments: limit,
      }),
    });

    const data = await res.json();

    const detail = await fetch(`http://localhost:8000/scans/${data.scan_id}`);
    const detailData = await detail.json();

    setVideoInfo(detailData.scan);
    setResults(detailData.results);
    setLoading(false);
  };

  // ====== KATEGORI ======
  const rendah = results.filter((r) => r.proba_judi <= 0.5);
  const sedang = results.filter(
    (r) => r.proba_judi > 0.5 && r.proba_judi < 0.8,
  );
  const tinggi = results.filter((r) => r.proba_judi >= 0.8);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        Deteksi Penyebaran Link Judi di Komentar YouTube
      </h1>

      {/* ===== INPUT ===== */}
      <div className="flex gap-3">
        <input
          className="border p-2 w-full"
          placeholder="Paste link video YouTube..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <input
          type="number"
          className="border p-2 w-32"
          value={limit}
          min={1}
          max={2000}
          onChange={(e) => setLimit(Number(e.target.value))}
          title="Limit komentar"
        />

        <button
          onClick={scanVideo}
          className="bg-blue-600 text-white px-4 py-2"
        >
          Scan
        </button>
      </div>

      {loading && <p>Scanning komentar...</p>}

      {/* ===== INFO VIDEO ===== */}
      {videoInfo && (
        <div className="border p-4 bg-gray-100">
          <h2 className="text-xl font-semibold mb-2">Informasi Video</h2>
          <p>
            <b>Judul:</b> {videoInfo.video_title}
          </p>
          <p>
            <b>Channel:</b> {videoInfo.channel_name}
          </p>
          <p>
            <b>Video ID:</b> {videoInfo.video_id}
          </p>
          <p>
            <b>Total komentar diambil:</b> {videoInfo.total_comments}
          </p>
          <p>
            <b>Komentar terindikasi judi:</b> {videoInfo.flagged_count}
          </p>
        </div>
      )}

      {/* ===== STATISTIK ===== */}
      {results.length > 0 && (
        <div className="flex gap-4">
          <Stat color="bg-green-200" title="Rendah" value={rendah.length} />
          <Stat color="bg-yellow-200" title="Sedang" value={sedang.length} />
          <Stat color="bg-red-200" title="Tinggi" value={tinggi.length} />
        </div>
      )}

      {/* ===== TABEL ===== */}
      <Table title="🟢 Risiko Rendah" data={rendah} />
      <Table title="🟡 Risiko Sedang" data={sedang} />
      <Table title="🔴 Risiko Tinggi" data={tinggi} />
    </div>
  );
}

function Stat({ title, value, color }: any) {
  return (
    <div className={`p-4 ${color} rounded`}>
      <p className="font-bold">{title}</p>
      <p className="text-2xl">{value}</p>
    </div>
  );
}

function Table({ title, data }: any) {
  if (data.length === 0) return null;

  return (
    <div>
      <h2 className="font-semibold mb-2">
        {title} ({data.length})
      </h2>
      <div className="overflow-auto max-h-64 border">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="border p-2">Komentar</th>
              <th className="border p-2">Probabilitas</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r: any) => (
              <tr key={r.id}>
                <td className="border p-2">{r.comment_text}</td>
                <td className="border p-2">
                  {(r.proba_judi * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
