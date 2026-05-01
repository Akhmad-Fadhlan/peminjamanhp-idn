import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setBusy(true);
    try {
      await login(username.trim(), password);
      toast.success("Login berhasil");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Login gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-b from-accent/40 to-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-xl font-bold shadow-lg">ID</div>
          <h1 className="mt-3 text-2xl font-bold">IDN Monitoring</h1>
          <p className="text-sm text-muted-foreground">Masuk untuk melanjutkan</p>
        </div>
        <form onSubmit={submit} className="card p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Username</label>
            <input className="input mt-1" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <input className="input mt-1" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button disabled={busy} className="btn-primary w-full">{busy ? "Memproses…" : "Masuk"}</button>
          <p className="text-[11px] text-center text-muted-foreground">Demo: admin / admin123</p>
        </form>
      </div>
    </div>
  );
}
