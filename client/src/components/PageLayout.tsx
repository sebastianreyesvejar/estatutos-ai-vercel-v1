import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowLeft } from "lucide-react";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  headerColor?: "navy" | "orange" | "teal";
}

export default function PageLayout({ title, subtitle, backHref, backLabel, actions, children, headerColor = "navy" }: PageLayoutProps) {
  const { user, isAuthenticated } = useAuth();

  const headerBg = {
    navy: "oklch(0.18 0.06 270)",
    orange: "oklch(0.68 0.19 40)",
    teal: "oklch(0.68 0.13 210)",
  }[headerColor];

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Poppins', sans-serif", background: "#f8fafc" }}>

      {/* ── NAV ── */}
      <nav style={{ background: "oklch(0.18 0.06 270)", color: "white" }} className="px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs" style={{ background: "oklch(0.68 0.19 40)", color: "white" }}>
              EA
            </div>
            <span className="font-bold text-white text-sm hidden sm:block">Estatutos AI</span>
          </Link>
          <span className="text-white/20 hidden md:block">|</span>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Base", href: "/knowledge" },
              { label: "Empresas", href: "/companies" },
              { label: "Redactor", href: "/drafts" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                {item.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link href="/admin"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                Admin
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <span className="text-white/70 text-sm font-medium">{user?.name}</span>
          ) : (
            <a href={getLoginUrl()} className="btn-pill btn-orange text-xs py-1.5 px-4">
              Ingresar
            </a>
          )}
        </div>
      </nav>

      {/* ── PAGE HEADER ── */}
      <header style={{ background: headerBg }} className="px-6 pt-8 pb-0 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {backHref && (
            <Link href={backHref}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium mb-4 transition-colors">
              <ArrowLeft size={14} /> {backLabel ?? "Volver"}
            </Link>
          )}
          <div className="flex items-end justify-between gap-4 pb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {title}
              </h1>
              {subtitle && <p className="text-white/60 text-sm mt-1 font-medium">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
          </div>
        </div>
        {/* Wave */}
        <svg viewBox="0 0 1440 40" className="w-full block" style={{ marginBottom: "-2px" }} preserveAspectRatio="none">
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#f8fafc" />
        </svg>
      </header>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: "oklch(0.18 0.06 270)", color: "white" }} className="px-6 py-5 mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center font-black text-xs" style={{ background: "oklch(0.68 0.19 40)" }}>
              EA
            </div>
            <span className="text-white/50 text-xs">Estatutos AI — {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
