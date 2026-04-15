import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Search, Filter, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
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
    <PageLayout title="Base de Conocimiento" subtitle={`${data?.total ?? 0} objetos sociales`}>
      {/* Filters */}
      <div className="border-b border-border px-8 py-4 flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por actividad, rubro o texto..."
            className="pl-9 bg-input border-border font-mono text-sm h-9"
          />
        </div>
        <Select value={rubro} onValueChange={v => { setRubro(v); setPage(0); }}>
          <SelectTrigger className="w-52 bg-input border-border font-mono text-xs h-9">
            <Filter size={12} className="mr-2" />
            <SelectValue placeholder="Filtrar por rubro" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="font-mono text-xs">Todos los rubros</SelectItem>
            {rubros?.map(r => (
              <SelectItem key={r} value={r} className="font-mono text-xs">{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="brutalista-label">Cargando...</p>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="brutalista-heading text-4xl text-muted-foreground mb-2">0</p>
              <p className="brutalista-label">No se encontraron resultados</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data?.items.map(item => (
              <Link key={item.id} href={`/companies/${item.companyId}`} className="block px-8 py-6 hover:bg-accent transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-foreground text-sm group-hover:text-foreground">{item.companyName ?? "Empresa"}</span>
                      {item.isValidated && (
                        <CheckCircle size={12} className="text-green-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                      {item.structuredText ?? item.rawText}
                    </p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {item.rubro && <span className="brutalista-tag">{item.rubro}</span>}
                      {item.extractionConfidence && (
                        <span className={`brutalista-tag ${item.extractionConfidence === 'high' ? 'status-processed' : item.extractionConfidence === 'medium' ? 'status-processing' : 'status-error'}`}>
                          {item.extractionConfidence}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs font-mono shrink-0">
                    {new Date(item.createdAt).toLocaleDateString("es-CL")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-border px-8 py-4 flex items-center justify-between">
          <span className="brutalista-label">Página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border border-border px-3 py-1 font-mono text-xs disabled:opacity-30 hover:bg-accent transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border border-border px-3 py-1 font-mono text-xs disabled:opacity-30 hover:bg-accent transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
