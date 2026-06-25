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
      return (
        t.nama_siswa.toLowerCase().includes(keyword) ||
        t.nisn.includes(keyword) ||
        t.kelas.toLowerCase().includes(keyword)
      );
    });
  }, [items, q, status]);

  const dipinjam = items.filter((i) => i.status === "dipinjam").length;
  const kembali = items.filter((i) => i.status === "kembali").length;
  const terlambat = items.filter((i) => i.status === "terlambat").length;

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Pantau</p>
        <h1 className="text-2xl font-bold tracking-tight">Data Peminjaman</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Seluruh transaksi peminjaman HP siswa</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Dipinjam" value={dipinjam} tone="primary" loading={loading} />
        <StatCard label="Kembali" value={kembali} tone="success" loading={loading} />
        <StatCard label="Terlambat" value={terlambat} tone="danger" loading={loading} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            className="input pl-10"
            placeholder="Cari nama, NISN, kelas…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            id="search-transaksi"
          />
        </div>
        <select
          className="input sm:w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          id="filter-status"
        >
          <option value="">Semua status</option>
          <option value="dipinjam">Dipinjam</option>
          <option value="kembali">Kembali</option>
          <option value="terlambat">Terlambat</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex justify-between">
                <div className="skeleton h-4 w-36 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-3 w-48 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-muted grid place-items-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-foreground">Belum ada data</p>
            <p className="text-xs text-muted-foreground mt-1">Tidak ditemukan transaksi yang sesuai</p>
          </div>
        ) : (
          filtered.map((t, i) => (
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
                  <span>Pinjam: {t.waktu_pinjam}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  <span>Kembali: {t.waktu_kembali || "—"}</span>
                </div>
                {t.durasi && (
                  <span className="col-span-2 flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Durasi: {t.durasi}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Transaksi["status"] }) {
  if (status === "terlambat") return <span className="badge-danger">Terlambat</span>;
  if (status === "kembali") return <span className="badge-success">Kembali</span>;
  return <span className="badge-warning">Dipinjam</span>;
}

function StatCard({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: number;
  tone: "primary" | "success" | "danger";
  loading: boolean;
}) {
  const cfg = {
    primary: {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      bg: "oklch(0.52 0.22 265 / 0.10)",
      color: "oklch(0.42 0.22 265)",
      border: "oklch(0.52 0.22 265 / 0.15)",
    },
    success: {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      bg: "oklch(0.62 0.18 152 / 0.10)",
      color: "oklch(0.48 0.18 152)",
      border: "oklch(0.62 0.18 152 / 0.15)",
    },
    danger: {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      bg: "oklch(0.58 0.24 27 / 0.10)",
      color: "oklch(0.52 0.22 27)",
      border: "oklch(0.58 0.24 27 / 0.15)",
    },
  } as const;
  const c = cfg[tone];
  return (
    <div
      className="card p-3.5 transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: `0 1px 3px rgba(0,0,0,.05), 0 0 0 1px ${c.border}` }}
    >
      <div
        className="w-8 h-8 rounded-xl grid place-items-center mb-2"
        style={{ background: c.bg, color: c.color }}
      >
        {c.icon}
      </div>
      {loading ? (
        <div className="skeleton h-6 w-10 rounded mb-1" />
      ) : (
        <p className="text-2xl font-bold tracking-tight" style={{ color: c.color }}>{value}</p>
      )}
      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
