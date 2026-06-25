import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

const tabs = [
  {
    to: "/",
    label: "Peminjaman",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
      </svg>
    ),
  },
  {
    to: "/scan",
    label: "Scan",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
        <rect x="8" y="8" width="8" height="8" rx="1" />
      </svg>
    ),
  },
  {
    to: "/siswa",
    label: "Siswa",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl avatar-gradient animate-pulse" />
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground font-medium">Memuat aplikasi…</p>
        </div>
      </div>
    );
  }

  const initial = user.nama?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/60" style={{ boxShadow: "0 1px 0 rgba(80,70,180,.08), 0 4px 16px rgba(0,0,0,.05)" }}>
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl avatar-gradient grid place-items-center text-white text-xs font-bold shadow-sm transition-transform group-hover:scale-105">
              IDN
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:inline text-foreground">
              IDN Monitoring
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline font-medium">{user.nama}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span className="hidden sm:inline">Keluar</span>
            </button>
            <div className="w-8 h-8 rounded-full avatar-gradient grid place-items-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
              {initial}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-24">
        {children ?? <Outlet />}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 glass border-t border-white/60"
        style={{ boxShadow: "0 -1px 0 rgba(80,70,180,.08), 0 -4px 20px rgba(0,0,0,.06)" }}
      >
        <div className="mx-auto max-w-3xl grid grid-cols-3 px-2 py-1">
          {tabs.map((t) => {
            const active = t.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 relative"
                style={{
                  color: active ? "var(--color-primary)" : "var(--color-muted-foreground)",
                }}
              >
                {active && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "oklch(0.52 0.22 265 / 0.08)" }}
                  />
                )}
                <span className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                  {t.icon(active)}
                </span>
                <span className={`text-[10px] font-${active ? "700" : "500"} leading-none`}>
                  {t.label}
                </span>
                {active && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: "var(--color-primary)" }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
