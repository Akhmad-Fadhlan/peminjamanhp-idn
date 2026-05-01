import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, getList, normalizeTransaksi, type Kelas, type Transaksi } from "@/lib/api";

export const Route = createFileRoute("/transaksi")({
  component: () => (
    <AppShell>
      <TransaksiPage />
    </AppShell>
  ),
});

const PAGE_SIZE = 10;

function TransaksiPage() {
  const [items, setItems] = useState<Transaksi[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (date) { params.start_date = date; params.end_date = date; }
      const [t, k] = await Promise.all([
        api.get("/transaksi", { params }),
        kelas.length ? Promise.resolve({ data: { data: kelas } }) : api.get("/kelas"),
      ]);
      setItems(getList(t.data, "transaksi").map(normalizeTransaksi));
      setKelas(k.data?.data || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, date]);

  const filtered = useMemo(
    () => (kelasFilter ? items.filter((i) => i.kelas === kelasFilter) : items),
    [items, kelasFilter],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [status, kelasFilter, date]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Riwayat Transaksi</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} data</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="dipinjam">Dipinjam</option>
          <option value="kembali">Kembali</option>
          <option value="terlambat">Terlambat</option>
        </select>
        <select className="input" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)}>
          <option value="">Semua kelas</option>
          {kelas.map((k) => <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>)}
        </select>
        <input className="input col-span-2 sm:col-span-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : pageItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
        ) : (
          pageItems.map((t) => (
            <div key={t.id} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{t.nama_siswa}</p>
                  <p className="text-xs text-muted-foreground">{t.kelas} · {t.nisn}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-1">
                <span>Pinjam: {t.waktu_pinjam}</span>
                <span>Kembali: {t.waktu_kembali || "-"}</span>
                {t.durasi && <span className="col-span-2">Durasi: {t.durasi}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Sebelumnya</button>
          <span className="text-sm text-muted-foreground">Halaman {page} / {totalPages}</span>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Berikutnya ›</button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Transaksi["status"] }) {
  if (status === "terlambat") return <span className="badge-danger">Terlambat</span>;
  if (status === "kembali") return <span className="badge-success">Kembali</span>;
  return <span className="badge-warning">Dipinjam</span>;
}
