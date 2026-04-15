import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Building2, FileText, Search, Sparkles, Zap } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = trpc.knowledge.stats.useQuery();

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Poppins', sans-serif", background: "#f8fafc" }}>

      {/* ── NAV ── */}
      <nav style={{ background: "oklch(0.18 0.06 270)", color: "white" }} className="px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: "oklch(0.68 0.19 40)", color: "white" }}>
            EA
          </div>
          <span className="font-bold text-base tracking-tight text-white">Estatutos AI</span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: "Base de Conocimiento", href: "/knowledge" },
            { label: "Empresas", href: "/companies" },
            { label: "Redactor", href: "/drafts" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all">
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link href="/admin"
              className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all">
              Admin
            </Link>
          ) : (
            <a href={getLoginUrl()}
              className="ml-2 btn-pill btn-orange text-sm">
              Ingresar
            </a>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(135deg, oklch(0.18 0.06 270) 0%, oklch(0.25 0.08 260) 100%)" }}
        className="px-6 pt-16 pb-0 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-white z-10">
            <div className="evo-badge evo-badge-orange mb-4">Plataforma Societaria Inteligente</div>
            <h1 className="text-5xl md:text-7xl font-black leading-none mb-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
              ESTATUTOS<br />
              <span style={{ color: "oklch(0.68 0.19 40)" }}>INTELIGENTE</span>
            </h1>
            <p className="text-white/70 text-lg max-w-lg leading-relaxed mb-8">
              Análisis automatizado de objetos sociales. Base de conocimiento estructurada.
              Redacción asistida por IA para nuevos estatutos societarios.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/knowledge" className="btn-pill btn-orange flex items-center gap-2">
                Explorar Base <ArrowRight size={16} />
              </Link>
              {isAuthenticated ? (
                <Link href="/drafts" className="btn-pill btn-teal flex items-center gap-2">
                  Redactar Estatuto
                </Link>
              ) : (
                <a href={getLoginUrl()} className="btn-pill btn-teal flex items-center gap-2">
                  Iniciar Sesión
                </a>
              )}
            </div>
          </div>
          {/* Decorative block */}
          <div className="flex-1 flex justify-center relative">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 rounded-3xl opacity-20" style={{ background: "oklch(0.68 0.19 40)" }} />
              <div className="absolute top-6 left-6 right-6 bottom-6 rounded-2xl flex flex-col items-center justify-center gap-4"
                style={{ background: "oklch(0.22 0.07 270)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "oklch(0.68 0.19 40)" }}>
                  <FileText size={32} color="white" />
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-3xl" style={{ fontFamily: "'Nunito', sans-serif" }}>
                    {stats?.totalSocialObjects ?? "—"}
                  </p>
                  <p className="text-white/60 text-sm font-medium">Objetos Sociales</p>
                </div>
                <div className="flex gap-3">
                  <div className="text-center">
                    <p className="text-white font-bold text-xl">{stats?.totalCompanies ?? "—"}</p>
                    <p className="text-white/50 text-xs">Empresas</p>
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-white font-bold text-xl">{stats?.rubros ?? "—"}</p>
                    <p className="text-white/50 text-xs">Rubros</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <svg viewBox="0 0 1440 80" className="w-full mt-8 block" style={{ marginBottom: "-2px" }} preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fafc" />
        </svg>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6" style={{ background: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto">
          <p className="evo-label text-center mb-2">Estadísticas de la plataforma</p>
          <h2 className="text-3xl font-black text-center mb-12" style={{ fontFamily: "'Nunito', sans-serif", color: "oklch(0.18 0.06 270)" }}>
            Base de Conocimiento en Números
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Empresas", value: stats?.totalCompanies ?? "—", sub: "analizadas", color: "var(--orange)", bg: "oklch(0.68 0.19 40 / 0.08)" },
              { label: "Documentos", value: stats?.totalDocuments ?? "—", sub: "procesados", color: "var(--teal)", bg: "oklch(0.68 0.13 210 / 0.08)" },
              { label: "Objetos Sociales", value: stats?.totalSocialObjects ?? "—", sub: "extraídos", color: "oklch(0.55 0.15 145)", bg: "oklch(0.65 0.15 145 / 0.08)" },
              { label: "Rubros", value: stats?.rubros ?? "—", sub: "identificados", color: "oklch(0.55 0.15 300)", bg: "oklch(0.65 0.15 300 / 0.08)" },
            ].map((s, i) => (
              <div key={i} className="evo-card text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: s.bg }}>
                  <div className="w-4 h-4 rounded-full" style={{ background: s.color }} />
                </div>
                <p className="text-3xl font-black mb-1" style={{ fontFamily: "'Nunito', sans-serif", color: s.color }}>
                  {String(s.value)}
                </p>
                <p className="font-semibold text-sm" style={{ color: "oklch(0.18 0.06 270)" }}>{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAVE + FEATURES ── */}
      <section style={{ background: "oklch(0.95 0.04 210)" }} className="relative">
        <svg viewBox="0 0 1440 60" className="w-full block" style={{ marginTop: "-2px" }} preserveAspectRatio="none">
          <path d="M0,30 C480,60 960,0 1440,30 L1440,0 L0,0 Z" fill="#f8fafc" />
        </svg>
        <div className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="evo-label text-center mb-2">Funcionalidades</p>
            <h2 className="text-3xl font-black text-center mb-12" style={{ fontFamily: "'Nunito', sans-serif", color: "oklch(0.18 0.06 270)" }}>
              Todo lo que necesitas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <BookOpen size={22} />, title: "Base de Conocimiento", desc: "Objetos sociales organizados por rubro, actividad y palabras clave.", href: "/knowledge", color: "evo-icon-orange" },
                { icon: <Search size={22} />, title: "Búsqueda Semántica", desc: "Encuentra estatutos similares por rubro, actividad o texto libre.", href: "/knowledge", color: "evo-icon-teal" },
                { icon: <Building2 size={22} />, title: "Vista por Empresa", desc: "Detalle completo con documento original y extracción validable.", href: "/companies", color: "evo-icon-green" },
                { icon: <Sparkles size={22} />, title: "Redactor Inteligente", desc: "Genera borradores de objetos sociales y estatutos completos con IA.", href: "/drafts", color: "evo-icon-purple" },
              ].map((f, i) => (
                <Link key={i} href={f.href} className="evo-card block group cursor-pointer">
                  <div className={`evo-icon ${f.color} mb-4`}>{f.icon}</div>
                  <h3 className="font-bold text-base mb-2" style={{ color: "oklch(0.18 0.06 270)", fontFamily: "'Nunito', sans-serif" }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                  <div className="flex items-center gap-1 mt-4 text-xs font-semibold" style={{ color: "oklch(0.68 0.19 40)" }}>
                    Ver más <ArrowRight size={12} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <svg viewBox="0 0 1440 60" className="w-full block" style={{ marginBottom: "-2px" }} preserveAspectRatio="none">
          <path d="M0,30 C480,0 960,60 1440,30 L1440,60 L0,60 Z" fill="#f8fafc" />
        </svg>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6" style={{ background: "#f8fafc" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "oklch(0.68 0.19 40)" }}>
            <Zap size={28} color="white" />
          </div>
          <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "'Nunito', sans-serif", color: "oklch(0.18 0.06 270)" }}>
            ¿Listo para redactar?
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            Genera objetos sociales y estatutos completos en segundos, basados en más de {stats?.totalSocialObjects ?? "miles de"} documentos analizados.
          </p>
          {isAuthenticated ? (
            <Link href="/drafts" className="btn-pill btn-orange inline-flex items-center gap-2 text-base px-8 py-4">
              Crear nuevo borrador <ArrowRight size={18} />
            </Link>
          ) : (
            <a href={getLoginUrl()} className="btn-pill btn-orange inline-flex items-center gap-2 text-base px-8 py-4">
              Comenzar ahora <ArrowRight size={18} />
            </a>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "oklch(0.18 0.06 270)", color: "white" }} className="px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs" style={{ background: "oklch(0.68 0.19 40)" }}>
              EA
            </div>
            <span className="font-bold text-white">Estatutos AI</span>
          </div>
          <p className="text-white/50 text-sm">Plataforma de análisis societario — {new Date().getFullYear()}</p>
          {isAuthenticated && <span className="text-white/70 text-sm font-medium">{user?.name}</span>}
        </div>
      </footer>
    </div>
  );
}
