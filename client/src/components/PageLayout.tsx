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
}

export default function PageLayout({ title, subtitle, backHref, backLabel, actions, children }: PageLayoutProps) {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Nav */}
      <nav className="border-b border-border px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 bg-foreground flex items-center justify-center">
              <span className="text-background font-mono font-bold text-xs">EA</span>
            </div>
          </Link>
          <span className="text-border">|</span>
          <Link href="/knowledge" className="brutalista-label hover:text-foreground transition-colors">Base</Link>
          <Link href="/companies" className="brutalista-label hover:text-foreground transition-colors">Empresas</Link>
          <Link href="/drafts" className="brutalista-label hover:text-foreground transition-colors">Redactor</Link>
          {isAuthenticated && <Link href="/admin" className="brutalista-label hover:text-foreground transition-colors">Admin</Link>}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <span className="brutalista-label text-foreground">{user?.name}</span>
          ) : (
            <a href={getLoginUrl()} className="bg-foreground text-background px-3 py-1.5 font-mono text-xs tracking-widest uppercase hover:bg-muted-foreground transition-colors">
              Ingresar
            </a>
          )}
        </div>
      </nav>

      {/* Page Header */}
      <header className="border-b border-border px-8 py-8 shrink-0">
        {backHref && (
          <Link href={backHref} className="flex items-center gap-2 brutalista-label hover:text-foreground transition-colors mb-4">
            <ArrowLeft size={12} /> {backLabel ?? "Volver"}
          </Link>
        )}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="brutalista-heading text-4xl md:text-5xl text-foreground">{title}</h1>
            {subtitle && <p className="brutalista-label mt-2">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
