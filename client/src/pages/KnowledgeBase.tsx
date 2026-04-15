import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Search, Filter, CheckCircle, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageLayout from "@/components/PageLayout";

const PAGE_SIZE = 20;

export default function KnowledgeBase() {
  const [query, setQuery] = useState("");
  const [rubro, setRubro] = useState("all");
  const [page, setPage] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: rubros } = trpc.knowledge.rubros.useQuery();
  const { data, isLoading } = trpc.knowledge.search.useQuery({
    query: debouncedQuery || undefined,
    rubro: rubro === "all" ? undefined : rubro,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const handleSearch = (v: string) => {
    setQuery(v);
    setPage(0);
    const t = setTimeout(() => setDebouncedQuery(v), 400);
    return () => clearTimeout(t);
  };

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <PageLayout title="Base de Conocimiento" subtitle={`${data?.total ?? 0} objetos sociales indexados`} headerColor="teal">

      {/* Filters */}
      <div className="px-6 py-4 border-b" style={{ background: "white", borderColor: "oklch(0.93 0.02 210)" }}>
        <div className="max-w-6xl mx-auto flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.68 0.13 210)" }} />
            <Input
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por actividad, rubro o texto..."
              className="pl-9 text-sm h-10 rounded-xl"
              style={{ border: "1.5px solid oklch(0.90 0.03 210)", fontFamily: "'Poppins', sans-serif" }}
            />
          </div>
          <Select value={rubro} onValueChange={v => { setRubro(v); setPage(0); }}>
            <SelectTrigger className="w-52 h-10 rounded-xl text-sm" style={{ border: "1.5px solid oklch(0.90 0.03 210)" }}>
              <Filter size={12} className="mr-2" style={{ color: "oklch(0.68 0.13 210)" }} />
              <SelectValue placeholder="Filtrar por rubro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los rubros</SelectItem>
              {rubros?.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse" style={{ background: "oklch(0.68 0.13 210 / 0.15)" }}>
                  <BookOpen size={20} style={{ color: "oklch(0.68 0.13 210)" }} />
                </div>
                <p className="text-sm font-medium text-gray-400">Cargando resultados...</p>
              </div>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "oklch(0.68 0.13 210 / 0.1)" }}>
                  <Search size={28} style={{ color: "oklch(0.68 0.13 210)" }} />
                </div>
                <p className="font-bold text-lg mb-1" style={{ color: "oklch(0.18 0.06 270)", fontFamily: "'Nunito', sans-serif" }}>Sin resultados</p>
                <p className="text-gray-400 text-sm">Intenta con otros términos de búsqueda</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {data?.items.map(item => (
                <Link key={item.id} href={`/companies/${item.companyId}`}
                  className="evo-card block cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-bold text-base" style={{ color: "oklch(0.18 0.06 270)", fontFamily: "'Nunito', sans-serif" }}>
                          {item.companyName ?? "Empresa"}
                        </span>
                        {item.isValidated && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "oklch(0.45 0.15 145)" }}>
                            <CheckCircle size={12} /> Validado
                          </span>
                        )}
                        {item.rubro && (
                          <span className="evo-badge evo-badge-teal">{item.rubro}</span>
                        )}
                        {item.extractionConfidence && (
                          <span className={`status-${item.extractionConfidence === 'high' ? 'processed' : item.extractionConfidence === 'medium' ? 'processing' : 'error'}`}>
                            {item.extractionConfidence === 'high' ? 'Alta confianza' : item.extractionConfidence === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed line-clamp-3 text-gray-500">
                        {item.structuredText ?? item.rawText}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-gray-400 shrink-0">
                      {new Date(item.createdAt).toLocaleDateString("es-CL")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t" style={{ background: "white", borderColor: "oklch(0.93 0.02 210)" }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">Página {page + 1} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-pill btn-outline-orange px-3 py-1.5 text-xs disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-pill btn-orange px-3 py-1.5 text-xs disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
