import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore, userStore } from "./api";

export type User = { id: number; nama: string; username: string; role: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = tokenStore.get();
    const u = userStore.get();
    if (t && u) setUser(u);
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post("/login", { username, password });
    const token = data?.data?.token;
    const nextUser = data?.data?.user;
    if (!data?.success || !token || !nextUser) throw new Error(data?.message || "Login gagal");
    tokenStore.set(token);
    userStore.set(nextUser);
    setUser(nextUser);
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    window.location.href = "/login";
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
