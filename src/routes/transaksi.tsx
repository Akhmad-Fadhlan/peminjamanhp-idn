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
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Riwayat</p>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} data transaksi</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} id="filter-status">
          <option value="">Semua status</option>
          <option value="dipinjam">Dipinjam</option>
          <option value="kembali">Kembali</option>
          <option value="terlambat">Terlambat</option>
        </select>
        <select className="input" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} id="filter-kelas">
          <option value="">Semua kelas</option>
          {kelas.map((k) => <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>)}
        </select>
        <input
          className="input col-span-2 sm:col-span-1"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          id="filter-tanggal"
        />
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="flex justify-between">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-3 w-28 rounded" />
              <div className="flex gap-4 pt-1">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          ))
        ) : pageItems.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-muted grid place-items-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <p className="text-sm font-semibold">Belum ada transaksi</p>
            <p className="text-xs text-muted-foreground mt-1">Coba ubah filter untuk melihat data lain</p>
          </div>
        ) : (
          pageItems.map((t, i) => (
            <div
              key={t.id}
              className="card p-4 hover:shadow-md transition-all duration-200 animate-fade-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 grid place-items-center text-white text-sm font-bold"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {t.nama_siswa.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{t.nama_siswa}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.kelas} · {t.nisn}</p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  Pinjam: {t.waktu_pinjam}
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Kembali: {t.waktu_kembali || "—"}
                </div>
                {t.durasi && (
                  <span className="col-span-2 flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Durasi: {t.durasi}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            className="btn-secondary gap-1.5"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            id="btn-prev-page"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Sebelumnya
          </button>
          <span className="text-sm text-muted-foreground font-medium">
            {page} / {totalPages}
          </span>
          <button
            className="btn-secondary gap-1.5"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            id="btn-next-page"
          >
            Berikutnya
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
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
