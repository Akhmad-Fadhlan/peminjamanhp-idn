import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { AppShell } from "@/components/AppShell";
import { api, type Kelas, type Siswa } from "@/lib/api";

export const Route = createFileRoute("/siswa")({
  component: () => (
    <AppShell>
      <SiswaPage />
    </AppShell>
  ),
});

type FormState = {
  id?: number;
  nama: string;
  nisn: string;
  kelas_id: number | "";
  foto?: string;
};
const empty: FormState = { nama: "", nisn: "", kelas_id: "" };

function SiswaPage() {
  const [list, setList] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterKelas, setFilterKelas] = useState<string>("");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [showQr, setShowQr] = useState<Siswa | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [s, k] = await Promise.all([api.get("/siswa"), api.get("/kelas")]);
      setList(s.data?.data || []);
      setKelas(k.data?.data || []);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return list.filter((s) => {
      if (filterKelas && String(s.kelas_id) !== filterKelas) return false;
      if (!qq) return true;
      return s.nama.toLowerCase().includes(qq) || (s.nisn || "").includes(qq);
    });
  }, [list, q, filterKelas]);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Manajemen</p>
          <h1 className="text-2xl font-bold tracking-tight">Data Siswa</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} siswa terdaftar</p>
        </div>
        <button
          className="btn-primary gap-1.5"
          onClick={() => setEditing({ ...empty })}
          id="btn-tambah-siswa"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah
        </button>
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
            placeholder="Cari nama / NISN…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            id="search-siswa"
          />
        </div>
        <select
          className="input sm:w-44"
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          id="filter-kelas"
        >
          <option value="">Semua kelas</option>
          {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="skeleton w-11 h-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
              <div className="skeleton h-8 w-20 rounded-lg" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-muted grid place-items-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
            </div>
            <p className="text-sm font-semibold">Tidak ada siswa</p>
            <p className="text-xs text-muted-foreground mt-1">Coba ubah kata kunci atau filter</p>
          </div>
        ) : (
          filtered.map((s, i) => <SiswaCard key={s.id} siswa={s} index={i} onEdit={() => setEditing({ id: s.id, nama: s.nama, nisn: s.nisn, kelas_id: s.kelas_id })} onQr={() => setShowQr(s)} />)
        )}
      </div>

      {editing && (
        <SiswaForm
          state={editing}
          kelas={kelas}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
      {showQr && <QrModal siswa={showQr} onClose={() => setShowQr(null)} />}
    </div>
  );
}

function SiswaCard({ siswa, index, onEdit, onQr }: { siswa: Siswa; index: number; onEdit: () => void; onQr: () => void }) {
  const colors = [
    "linear-gradient(135deg, oklch(0.42 0.24 270), oklch(0.58 0.22 255))",
    "linear-gradient(135deg, oklch(0.48 0.18 152), oklch(0.62 0.16 140))",
    "linear-gradient(135deg, oklch(0.52 0.20 30), oklch(0.68 0.18 45))",
    "linear-gradient(135deg, oklch(0.52 0.22 310), oklch(0.65 0.18 295))",
    "linear-gradient(135deg, oklch(0.52 0.18 210), oklch(0.65 0.16 200))",
  ];
  const grad = colors[index % colors.length];

  return (
    <div
      className="card p-3.5 flex items-center gap-3 hover:shadow-md transition-all duration-200 animate-fade-up"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex-shrink-0 grid place-items-center text-white text-sm font-bold shadow-sm"
        style={{ background: grad }}
      >
        {siswa.foto ? (
          <img src={siswa.foto} alt={siswa.nama} className="w-full h-full object-cover rounded-full" />
        ) : (
          siswa.nama.charAt(0).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{siswa.nama}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="badge-primary text-[10px] px-1.5 py-0">{siswa.nama_kelas}</span>
          <span className="text-xs text-muted-foreground">{siswa.nisn}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          title="QR Code"
          className="w-8 h-8 rounded-xl grid place-items-center text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all duration-150"
          onClick={onQr}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="3" height="3" /><rect x="18" y="18" width="3" height="3" />
          </svg>
        </button>
        <button
          title="Edit"
          className="w-8 h-8 rounded-xl grid place-items-center text-muted-foreground hover:text-warning-foreground hover:bg-warning/10 transition-all duration-150"
          onClick={onEdit}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SiswaForm({ state, kelas, onClose, onSaved }: {
  state: FormState; kelas: Kelas[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(state);
  const [busy, setBusy] = useState(false);
  const isEdit = !!form.id;

  const onFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm((v) => ({ ...v, foto: String(reader.result) }));
    reader.readAsDataURL(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.nisn.trim() || !form.kelas_id) {
      toast.error("Lengkapi semua field");
      return;
    }
    setBusy(true);
    try {
      const payload = { nama: form.nama.trim(), nisn: form.nisn.trim(), kelas_id: Number(form.kelas_id) };
      if (isEdit) {
        await api.put(`/siswa/${form.id}`, payload);
        toast.success("Data siswa diperbarui");
      } else {
        await api.post("/siswa", payload);
        toast.success("Siswa berhasil ditambahkan");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit Siswa" : "Tambah Siswa"}>
      <form onSubmit={submit} className="space-y-4">
        {/* Photo */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden grid place-items-center text-xs text-muted-foreground font-medium"
            style={{ background: "var(--color-muted)", border: "2px dashed var(--color-border)" }}
          >
            {form.foto ? (
              <img src={form.foto} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
            )}
          </div>
          <label className="btn-secondary cursor-pointer gap-2 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Upload Foto
            <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Nama Lengkap</label>
          <input className="input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama siswa" id="form-nama" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">NISN</label>
          <input className="input" value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} placeholder="Nomor NISN" id="form-nisn" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Kelas</label>
          <select
            className="input"
            value={form.kelas_id}
            onChange={(e) => setForm({ ...form, kelas_id: e.target.value ? Number(e.target.value) : "" })}
            id="form-kelas"
          >
            <option value="">— Pilih kelas —</option>
            {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>Batal</button>
          <button disabled={busy} className="btn-primary flex-1">
            {busy ? (
              <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> Menyimpan…</>
            ) : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function QrModal({ siswa, onClose }: { siswa: Siswa; onClose: () => void }) {
  return (
    <Modal title="QR Code Siswa" onClose={onClose}>
      <div className="text-center space-y-4">
        <div
          className="inline-block p-4 rounded-2xl"
          style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,.10)" }}
        >
          <QRCodeCanvas value={siswa.qr_code} size={200} />
        </div>
        <div>
          <p className="font-bold text-base">{siswa.nama}</p>
          <p className="text-sm text-muted-foreground">{siswa.nama_kelas}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{siswa.nisn}</p>
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-muted inline-block">
            <p className="text-xs font-mono text-muted-foreground break-all">{siswa.qr_code}</p>
          </div>
        </div>
        <button className="btn-secondary w-full" onClick={onClose}>Tutup</button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-5 sm:rounded-3xl rounded-t-3xl animate-slide-up sm:animate-scale-in"
        style={{ background: "var(--color-card)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base">{title}</h3>
          <button
            className="w-7 h-7 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted transition-colors"
            onClick={onClose}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
