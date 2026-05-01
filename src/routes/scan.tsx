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
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    
    const start = async () => {
      try {
        addDebug("Starting scanner...");
        const inst = new Html5Qrcode(elId, { verbose: false });
        scannerRef.current = inst;
        
        await inst.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
          (decoded) => {
            addDebug(`✅ QR detected: ${decoded}`);
            onDecoded(decoded);
          },
          (error) => {
            // Silent
          },
        );
        addDebug("Scanner started successfully");
        if (cancelled) await inst.stop().catch(() => {});
      } catch (e: any) {
        addDebug(`❌ Error: ${e.message}`);
        toast.error("Tidak bisa mengakses kamera");
        setActive(false);
      }
    };
    
    start();
    
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
      }
    };
  }, [active]);

  const onDecoded = async (code: string) => {
    addDebug(`Processing code: ${code}`);
    
    const now = Date.now();
    if (lockRef.current) {
      addDebug("Locked, skipping");
      return;
    }
    if (lastCodeRef.current && lastCodeRef.current.code === code && now - lastCodeRef.current.at < 3000) {
      addDebug("Duplicate, skipping");
      return;
    }
    
    lastCodeRef.current = { code, at: now };
    lockRef.current = true;
    setBusy(true);
    
    try {
      addDebug("Calling API...");
      const response = await api.post("/scan", { qr_code: code });
      
      addDebug(`API Response received: ${JSON.stringify(response.data)}`);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Gagal");
      }
      
      const responseData = response.data.data;
      addDebug(`Response data: ${JSON.stringify(responseData)}`);
      
      if (!responseData) {
        throw new Error("Data tidak ditemukan");
      }
      
      if (!responseData.status) {
        addDebug(`ERROR: Status missing. Keys: ${Object.keys(responseData).join(", ")}`);
        throw new Error(`Status tidak ditemukan. Keys: ${Object.keys(responseData).join(", ")}`);
      }
      
      const r: ScanResult = {
        message: responseData.pesan || response.data.message || "Berhasil",
        status: responseData.status,
        nama: responseData.nama || "Tidak diketahui",
        kelas: responseData.kelas || "Tidak diketahui",
        waktu: responseData.waktu || responseData.waktu_pinjam || new Date().toLocaleString('id-ID'),
        durasi: responseData.durasi || null,
        keterlambatan: responseData.keterlambatan || null,
      };
      
      addDebug(`Setting result: ${r.nama} - ${r.status}`);
      setResult(r);
      
      if (r.status === "terlambat") {
        toast.error(r.message);
      } else {
        toast.success(r.message);
      }
      
    } catch (err: any) {
      addDebug(`❌ Error: ${err.message}`);
      addDebug(`Full error: ${JSON.stringify(err)}`);
      console.error("Full error:", err);
      
      const errorMessage = err?.response?.data?.message || err?.message || "QR tidak valid";
      toast.error(errorMessage);
      setResult(null);
    } finally {
      setBusy(false);
      setTimeout(() => { 
        lockRef.current = false;
        addDebug("Lock released");
      }, 1500);
    }
  };

  const toneClass =
    result?.status === "terlambat"
      ? "border-destructive bg-destructive/10"
      : result?.status === "kembali"
      ? "border-success bg-success/10"
      : result?.status === "dipinjam"
      ? "border-primary bg-primary/10"
      : "border-border";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Scan QR Siswa</h1>
        <p className="text-sm text-muted-foreground">Arahkan kamera ke QR untuk pinjam / kembali.</p>
      </div>

      {/* Debug Panel */}
      <div className="bg-gray-900 text-green-400 text-xs p-2 rounded font-mono overflow-auto max-h-32">
        <p className="font-bold text-white mb-1">Debug Log:</p>
        {debugLog.map((log, i) => (
          <div key={i} className="border-b border-gray-700 py-0.5">{log}</div>
        ))}
        {debugLog.length === 0 && <div>Waiting for scan...</div>}
      </div>

      <div className="card overflow-hidden">
        <div className="relative bg-black aspect-square">
          <div id={elId} className="w-full h-full" />
          {!active && (
            <div className="absolute inset-0 grid place-items-center text-white text-sm">Kamera dimatikan</div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-black/60 text-white text-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                Memproses...
              </div>
            </div>
          )}
        </div>
        <div className="p-3 flex gap-2">
          <button onClick={() => setActive((a) => !a)} className="btn-secondary flex-1">
            {active ? "Matikan Kamera" : "Aktifkan Kamera"}
          </button>
          <button 
            onClick={() => {
              setResult(null);
              setDebugLog([]);
              addDebug("Debug cleared");
            }} 
            className="btn-ghost"
          >
            Bersihkan
          </button>
        </div>
      </div>
 
      {result && (
        <div className={`card p-4 border-2 ${toneClass} animate-in fade-in duration-300`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold">{result.nama}</p>
              <p className="text-sm text-muted-foreground">Kelas {result.kelas}</p>
            </div>
            <span className={
              result.status === "terlambat" ? "badge-danger"
              : result.status === "kembali" ? "badge-success"
              : "badge-warning"
            }>
              {result.status.toUpperCase()}
            </span>
          </div>
          <p className="mt-3 text-sm">{result.message}</p>
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            <p>Waktu: {result.waktu}</p>
            {result.durasi && <p>Durasi: {result.durasi}</p>}
            {result.keterlambatan && <p className="text-destructive font-medium">Terlambat: {result.keterlambatan}</p>}
          </div>
        </div>
      )}
    </div>
  );
}