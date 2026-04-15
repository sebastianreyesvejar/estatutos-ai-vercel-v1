import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ArrowRight, Database, FileText, Search, Zap } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = trpc.knowledge.stats.useQuery();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-foreground flex items-center justify-center">
            <span className="text-background font-mono font-bold text-xs">EA</span>
          </div>
          <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground">Estatutos AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/knowledge" className="brutalista-label hover:text-foreground transition-colors">Base de Conocimiento</Link>
          <Link href="/companies" className="brutalista-label hover:text-foreground transition-colors">Empresas</Link>
          <Link href="/drafts" className="brutalista-label hover:text-foreground transition-colors">Redactor</Link>
          {isAuthenticated ? (
            <Link href="/admin" className="brutalista-label hover:text-foreground transition-colors">Admin</Link>
          ) : (
            <a href={getLoginUrl()} className="bg-foreground text-background px-4 py-2 font-mono text-xs tracking-widest uppercase hover:bg-muted-foreground transition-colors">
              Ingresar
            </a>
          )}
        </div>
      </nav>

      <section className="px-8 pt-24 pb-16 border-b border-border">
        <div className="max-w-5xl">
          <p className="brutalista-label mb-6">Plataforma de Análisis Societario</p>
          <h1 className="brutalista-heading text-7xl md:text-9xl text-foreground mb-8 leading-none">
            ESTATUTOS<br />
            <span className="text-muted-foreground">INTELIGENTE</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed mb-12">
            Análisis automatizado de objetos sociales. Base de conocimiento estructurada.
            Redacción asistida por IA para nuevos estatutos societarios.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/knowledge" className="flex items-center gap-2 bg-foreground text-background px-6 py-3 font-mono text-xs tracking-widest uppercase hover:bg-muted-foreground transition-colors">
              Explorar Base <ArrowRight size={14} />
            </Link>
            {isAuthenticated ? (
              <Link href="/drafts" className="flex items-center gap-2 border border-border px-6 py-3 font-mono text-xs tracking-widest uppercase hover:bg-accent transition-colors">
                Redactar Estatuto
              </Link>
            ) : (
              <a href={getLoginUrl()} className="flex items-center gap-2 border border-border px-6 py-3 font-mono text-xs tracking-widest uppercase hover:bg-accent transition-colors">
                Iniciar Sesión
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
        {[
          { label: "Empresas", value: stats?.totalCompanies ?? "—", sub: "analizadas" },
          { label: "Documentos", value: stats?.totalDocuments ?? "—", sub: "procesados" },
          { label: "Objetos Sociales", value: stats?.totalSocialObjects ?? "—", sub: "extraídos" },
          { label: "Rubros", value: stats?.rubros ?? "—", sub: "identificados" },
        ].map((s, i) => (
          <div key={i} className="px-8 py-10 border-r border-border last:border-r-0">
            <p className="brutalista-label mb-2">{s.label}</p>
            <p className="brutalista-heading text-5xl text-foreground">{String(s.value)}</p>
            <p className="brutalista-label mt-1">{s.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-border">
        {[
          { icon: <Database size={20} />, title: "Base de Conocimiento", desc: "Objetos sociales organizados por rubro, actividad y palabras clave.", href: "/knowledge" },
          { icon: <Search size={20} />, title: "Búsqueda Semántica", desc: "Encuentra estatutos similares por rubro, actividad o texto libre.", href: "/knowledge" },
          { icon: <FileText size={20} />, title: "Vista por Empresa", desc: "Detalle completo de cada empresa con documento original y extracción.", href: "/companies" },
          { icon: <Zap size={20} />, title: "Redactor Inteligente", desc: "Genera borradores de objetos sociales y estatutos completos con IA.", href: "/drafts" },
        ].map((f, i) => (
          <Link key={i} href={f.href} className="block p-8 border-r border-border last:border-r-0 hover:bg-accent transition-colors group">
            <div className="text-muted-foreground group-hover:text-foreground mb-4 transition-colors">{f.icon}</div>
            <h3 className="font-bold text-foreground mb-2 text-sm tracking-tight">{f.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </Link>
        ))}
      </section>

      <footer className="px-8 py-6 flex items-center justify-between">
        <span className="brutalista-label">Estatutos AI — {new Date().getFullYear()}</span>
        {isAuthenticated && <span className="brutalista-label text-foreground">{user?.name}</span>}
      </footer>
    </div>
  );
}
