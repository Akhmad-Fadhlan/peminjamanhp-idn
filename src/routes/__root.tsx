import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="max-w-sm text-center animate-fade-up">
        <div
          className="mx-auto mb-6 w-24 h-24 rounded-3xl grid place-items-center"
          style={{ background: "oklch(0.52 0.22 265 / 0.1)", border: "1.5px solid oklch(0.52 0.22 265 / 0.15)" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="oklch(0.52 0.22 265)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold tracking-tight" style={{ color: "var(--color-primary)" }}>404</h1>
        <p className="mt-3 text-base font-semibold text-foreground">Halaman tidak ditemukan</p>
        <p className="mt-1 text-sm text-muted-foreground">Sepertinya halaman yang kamu cari tidak ada.</p>
        <Link
          to="/"
          className="btn-primary mt-6 inline-flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "IDN Monitoring HP" },
      { name: "description", content: "Sistem monitoring peminjaman HP siswa IDN" },
      { name: "theme-color", content: "#4c3bdb" },
      { property: "og:title", content: "IDN Monitoring HP" },
      { name: "twitter:title", content: "IDN Monitoring HP" },
      { property: "og:description", content: "Sistem monitoring peminjaman HP siswa IDN" },
      { name: "twitter:description", content: "Sistem monitoring peminjaman HP siswa IDN" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "14px",
          },
        }}
      />
    </AuthProvider>
  );
}
