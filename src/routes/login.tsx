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
  const [showPw, setShowPw] = useState(false);
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
      toast.success("Selamat datang! 👋");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Username atau password salah");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, oklch(0.38 0.26 272) 0%, oklch(0.52 0.24 258) 45%, oklch(0.65 0.20 248) 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, oklch(0.80 0.18 200), transparent)" }}
      />
      <div
        className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, oklch(0.80 0.20 290), transparent)" }}
      />

      <div className="w-full max-w-sm relative z-10 animate-fade-up">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div
            className="mx-auto w-16 h-16 rounded-2xl grid place-items-center text-white font-bold text-lg mb-4 shadow-lg"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.3)" }}
          >
            IDN
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">IDN Monitoring</h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">Sistem Monitoring Peminjaman HP</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6 space-y-5"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
        >
          <div>
            <h2 className="text-lg font-bold text-foreground">Masuk ke Akun</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Masukkan kredensial Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  </svg>
                </span>
                <input
                  className="input pl-10"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  id="login-username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  className="input pl-10 pr-11"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              disabled={busy || !username || !password}
              className="btn-primary w-full mt-2 py-3 text-base"
              id="login-submit"
            >
              {busy ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Memproses…
                </>
              ) : "Masuk"}
            </button>
          </form>

          <div className="pt-1 border-t border-border/60">
            <p className="text-[11px] text-center text-muted-foreground">
              Demo: <span className="font-semibold text-foreground/70">admin</span> / <span className="font-semibold text-foreground/70">admin123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/50 mt-6">IDN Monitoring HP &copy; 2025</p>
      </div>
    </div>
  );
}
