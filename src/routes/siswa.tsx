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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Data Siswa</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} siswa</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({ ...empty })}>+ Tambah</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <input className="input" placeholder="Cari nama / NISN…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-44" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
          <option value="">Semua kelas</option>
          {kelas.map((k) => (<option key={k.id} value={k.id}>{k.nama_kelas}</option>))}
        </select>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada siswa.</p>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="card p-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-accent grid place-items-center font-bold text-accent-foreground">
                {s.nama.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{s.nama}</p>
                <p className="text-xs text-muted-foreground">{s.nisn} · {s.nama_kelas}</p>
              </div>
              <div className="flex items-center gap-1">
                <button title="QR" className="btn-ghost px-2 py-2" onClick={() => setShowQr(s)}>🔳</button>
                <button title="Edit" className="btn-ghost px-2 py-2" onClick={() => setEditing({ id: s.id, nama: s.nama, nisn: s.nisn, kelas_id: s.kelas_id })}>✏️</button>
              </div>
            </div>
          ))
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
        toast.success("Siswa diupdate");
      } else {
        await api.post("/siswa", payload);
        toast.success("Siswa ditambahkan");
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
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden grid place-items-center text-muted-foreground">
            {form.foto ? <img src={form.foto} alt="" className="w-full h-full object-cover" /> : "Foto"}
          </div>
          <label className="btn-secondary cursor-pointer">
            Upload Foto
            <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Nama</label>
          <input className="input mt-1" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">NISN</label>
          <input className="input mt-1" value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Kelas</label>
          <select className="input mt-1" value={form.kelas_id} onChange={(e) => setForm({ ...form, kelas_id: e.target.value ? Number(e.target.value) : "" })}>
            <option value="">— Pilih kelas —</option>
            {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>Batal</button>
          <button disabled={busy} className="btn-primary flex-1">{busy ? "Menyimpan…" : "Simpan"}</button>
        </div>
      </form>
    </Modal>
  );
}

function QrModal({ siswa, onClose }: { siswa: Siswa; onClose: () => void }) {
  return (
    <Modal title="QR Code Siswa" onClose={onClose}>
      <div className="text-center space-y-3">
        <div className="bg-white p-4 rounded-xl inline-block">
          <QRCodeCanvas value={siswa.qr_code} size={220} />
        </div>
        <div>
          <p className="font-semibold">{siswa.nama}</p>
          <p className="text-xs text-muted-foreground">{siswa.nama_kelas} · {siswa.nisn}</p>
          <p className="text-xs mt-2 font-mono">{siswa.qr_code}</p>
        </div>
        <button className="btn-secondary w-full" onClick={onClose}>Tutup</button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-4 rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">{title}</h3>
          <button className="btn-ghost px-2 py-1" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
