import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, getList, normalizeTransaksi, type Transaksi } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Dashboard() {
  const [items, setItems] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    api
      .get("/transaksi")
      .then((r) => setItems(getList(r.data, "transaksi").map(normalizeTransaksi)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return items.filter((t) => {
      if (status && t.status !== status) return false;
      if (!keyword) return true;
      return t.nama_siswa.toLowerCase().includes(keyword) || t.nisn.includes(keyword) || t.kelas.toLowerCase().includes(keyword);
    });
  }, [items, q, status]);

  const dipinjam = items.filter((i) => i.status === "dipinjam").length;
  const kembali = items.filter((i) => i.status === "kembali").length;
  const terlambat = items.filter((i) => i.status === "terlambat").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Data Semua Peminjaman</h1>
        <p className="text-sm text-muted-foreground">Pantau seluruh transaksi peminjaman HP siswa</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Dipinjam" value={dipinjam} tone="primary" />
        <StatCard label="Kembali" value={kembali} tone="success" />
        <StatCard label="Terlambat" value={terlambat} tone="danger" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <input className="input" placeholder="Cari nama, NISN, kelas…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="dipinjam">Dipinjam</option>
          <option value="kembali">Kembali</option>
          <option value="terlambat">Terlambat</option>
        </select>
      </div>

      <div className="space-y-2">
        {loading ? <p className="text-sm text-muted-foreground">Memuat…</p> : filtered.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data.</p> : filtered.map((t) => (
          <div key={t.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{t.nama_siswa}</p>
                <p className="text-xs text-muted-foreground">{t.kelas} · {t.nisn}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-1">
              <span>Pinjam: {t.waktu_pinjam}</span>
              <span>Kembali: {t.waktu_kembali || "-"}</span>
              {t.durasi && <span className="sm:col-span-2">Durasi: {t.durasi}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Transaksi["status"] }) {
  if (status === "terlambat") return <span className="badge-danger">Terlambat</span>;
  if (status === "kembali") return <span className="badge-success">Kembali</span>;
  return <span className="badge-warning">Dipinjam</span>;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "primary" | "success" | "danger" }) {
  const map = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    danger: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <div className="card p-4">
      <div className={`inline-flex w-9 h-9 rounded-lg items-center justify-center text-sm font-bold ${map[tone]}`}>
        {value}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
