// src/routes/scan.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";

export const Route = createFileRoute("/scan")({
  component: () => (
    <AppShell>
      <ScanPage />
    </AppShell>
  ),
});

type ScanResult = {
  message: string;
  status: "dipinjam" | "kembali" | "terlambat";
  nama: string;
  kelas: string;
  waktu: string;
  durasi?: string | null;
  keterlambatan?: string | null;
};

function ScanPage() {
  const elId = "qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  const [active, setActive] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const start = async () => {
      try {
        const inst = new Html5Qrcode(elId, { verbose: false });
        scannerRef.current = inst;

        await inst.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
          (decoded) => { onDecoded(decoded); },
          () => { /* Silent frame errors */ },
        );
        if (cancelled) await inst.stop().catch(() => {});
      } catch (e: any) {
        toast.error("Tidak bisa mengakses kamera. Pastikan izin diberikan.");
        setActive(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) { s.stop().then(() => s.clear()).catch(() => {}); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const onDecoded = async (code: string) => {
    const now = Date.now();
    if (lockRef.current) return;
    if (lastCodeRef.current && lastCodeRef.current.code === code && now - lastCodeRef.current.at < 3000) return;

    lastCodeRef.current = { code, at: now };
    lockRef.current = true;
    setBusy(true);

    try {
      const response = await api.post("/scan", { qr_code: code });

      if (!response.data?.success) throw new Error(response.data?.message || "Gagal");

      const responseData = response.data.data;
      if (!responseData) throw new Error("Data tidak ditemukan");
      if (!responseData.status) throw new Error("Status tidak ditemukan");

      const r: ScanResult = {
        message: responseData.pesan || response.data.message || "Berhasil",
        status: responseData.status,
        nama: responseData.nama || "Tidak diketahui",
        kelas: responseData.kelas || "Tidak diketahui",
        waktu: responseData.waktu || responseData.waktu_pinjam || new Date().toLocaleString("id-ID"),
        durasi: responseData.durasi || null,
        keterlambatan: responseData.keterlambatan || null,
      };

      setResult(r);
      if (r.status === "terlambat") {
        toast.error(r.message);
      } else {
        toast.success(r.message);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "QR tidak valid";
      toast.error(errorMessage);
      setResult(null);
    } finally {
      setBusy(false);
      setTimeout(() => { lockRef.current = false; }, 1500);
    }
  };

  const statusCfg = {
    dipinjam: {
      bg: "oklch(0.52 0.22 265 / 0.08)",
      border: "oklch(0.52 0.22 265 / 0.3)",
      badge: "badge-primary",
      label: "DIPINJAM",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(0.42 0.22 265)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6z" />
        </svg>
      ),
    },
    kembali: {
      bg: "oklch(0.62 0.18 152 / 0.08)",
      border: "oklch(0.62 0.18 152 / 0.3)",
      badge: "badge-success",
      label: "KEMBALI",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(0.48 0.18 152)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    terlambat: {
      bg: "oklch(0.58 0.24 27 / 0.08)",
      border: "oklch(0.58 0.24 27 / 0.3)",
      badge: "badge-danger",
      label: "TERLAMBAT",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(0.52 0.22 27)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  };

  const cfg = result ? statusCfg[result.status] : null;

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Cepat</p>
        <h1 className="text-2xl font-bold tracking-tight">Scan QR Siswa</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Arahkan kamera ke QR untuk pinjam / kembali</p>
      </div>

      {/* Camera Card */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,.12), 0 1px 4px rgba(0,0,0,.06)" }}
      >
        {/* Viewfinder */}
        <div className="relative bg-black" style={{ aspectRatio: "1/1" }}>
          <div id={elId} className="w-full h-full" />

          {/* Overlay corners */}
          {active && !busy && (
            <div className="absolute inset-0 pointer-events-none" style={{ display: "grid", placeItems: "center" }}>
              <div className="relative w-48 h-48">
                {/* TL */}
                <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
                {/* TR */}
                <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
                {/* BL */}
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
                {/* BR */}
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
              </div>
            </div>
          )}

          {!active && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 grid place-items-center mx-auto mb-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                  </svg>
                </div>
                <p className="text-white/70 text-sm font-medium">Kamera dimatikan</p>
              </div>
            </div>
          )}

          {busy && (
            <div className="absolute inset-0 grid place-items-center" style={{ background: "rgba(0,0,0,0.65)" }}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto mb-3" />
                <p className="text-white text-sm font-semibold">Memproses…</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 flex gap-2.5" style={{ background: "var(--color-card)" }}>
          <button
            onClick={() => setActive((a) => !a)}
            className={active ? "btn-danger flex-1 gap-2" : "btn-primary flex-1 gap-2"}
            id="btn-toggle-camera"
          >
            {active ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                </svg>
                Matikan
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                Aktifkan Kamera
              </>
            )}
          </button>
          {result && (
            <button
              onClick={() => setResult(null)}
              className="btn-ghost gap-2"
              id="btn-clear-result"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Hapus
            </button>
          )}
        </div>
      </div>

      {/* Result Card */}
      {result && cfg && (
        <div
          className="rounded-3xl p-5 animate-fade-up"
          style={{
            background: cfg.bg,
            border: `1.5px solid ${cfg.border}`,
            boxShadow: "0 4px 20px rgba(0,0,0,.06)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex-shrink-0 grid place-items-center"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
            >
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-base leading-tight">{result.nama}</p>
                <span className={cfg.badge}>{cfg.label}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Kelas {result.kelas}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: cfg.border }}>
            <p className="text-sm font-medium">{result.message}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {result.waktu}
              </div>
              {result.durasi && (
                <div className="flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Durasi: {result.durasi}
                </div>
              )}
              {result.keterlambatan && (
                <div className="sm:col-span-2 flex items-center gap-1.5 font-semibold" style={{ color: "oklch(0.52 0.22 27)" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Terlambat: {result.keterlambatan}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tip */}
      {!result && (
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "oklch(0.52 0.22 265 / 0.06)", border: "1px solid oklch(0.52 0.22 265 / 0.12)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.42 0.22 265)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Arahkan kamera ke QR Code siswa. Sistem akan otomatis mendeteksi dan memproses peminjaman atau pengembalian HP.
          </p>
        </div>
      )}
    </div>
  );
}
