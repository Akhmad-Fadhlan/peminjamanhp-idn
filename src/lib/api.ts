import axios from "axios";

export const API_BASE_URL = "https://pymasterclass.codestechno.com/api";
const TOKEN_KEY = "idn_token";
const USER_KEY = "idn_user";

function parseApiResponse(data: unknown) {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    const jsonStart = data.lastIndexOf('{"success"');
    if (jsonStart >= 0) {
      try {
        return JSON.parse(data.slice(jsonStart));
      } catch {
        return data;
      }
    }
    return data;
  }
}

export const tokenStore = {
  get: () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStore = {
  get: () => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  set: (u: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  transformResponse: [parseApiResponse],
});

api.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      tokenStore.clear();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export type Kelas = { id: number; nama_kelas: string; created_at?: string };
export type Siswa = {
  id: number;
  nama: string;
  nisn: string;
  kelas_id: number;
  nama_kelas?: string;
  qr_code: string;
  foto?: string | null;
  wali_kelas_id?: number;
  nama_wali?: string;
};
export type Transaksi = {
  id: number;
  siswa_id: number;
  nama_siswa: string;
  nisn: string;
  kelas: string;
  waktu_pinjam: string;
  waktu_kembali: string | null;
  status: "dipinjam" | "kembali" | "terlambat";
  durasi: string | null;
};

export function getList<T = unknown>(payload: any, key?: string): T[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (key && Array.isArray(payload?.data?.[key])) return payload.data[key];
  return [];
}

export function normalizeTransaksi(raw: any): Transaksi {
  return {
    id: Number(raw.id),
    siswa_id: Number(raw.siswa_id),
    nama_siswa: raw.nama_siswa || raw.siswa_nama || raw.nama || "-",
    nisn: raw.nisn || "-",
    kelas: raw.kelas || raw.nama_kelas || "-",
    waktu_pinjam: raw.waktu_pinjam || "-",
    waktu_kembali: raw.waktu_kembali || null,
    status: raw.status,
    durasi: raw.durasi || null,
  };
}
