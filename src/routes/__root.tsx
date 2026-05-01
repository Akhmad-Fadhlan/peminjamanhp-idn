import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Halaman tidak ditemukan</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Kembali ke beranda</Link>
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
      { name: "description", content: "Sistem monitoring peminjaman HP siswa" },
      { name: "theme-color", content: "#3b5bdb" },
      { property: "og:title", content: "IDN Monitoring HP" },
      { name: "twitter:title", content: "IDN Monitoring HP" },
      { property: "og:description", content: "Sistem monitoring peminjaman HP siswa" },
      { name: "twitter:description", content: "Sistem monitoring peminjaman HP siswa" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/45a91391-3998-443f-9f69-46c36b9038d5/id-preview-968728d5--70c99ca0-98cb-4d54-b09f-ce8251ed7b63.lovable.app-1777609474872.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/45a91391-3998-443f-9f69-46c36b9038d5/id-preview-968728d5--70c99ca0-98cb-4d54-b09f-ce8251ed7b63.lovable.app-1777609474872.png" },
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
      <Toaster position="top-center" richColors closeButton />
    </AuthProvider>
  );
}
