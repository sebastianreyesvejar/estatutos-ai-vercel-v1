import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Search, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageLayout from "@/components/PageLayout";

const PAGE_SIZE = 50;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  processed: "Procesado",
  error: "Error",
};

export default function Companies() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = trpc.companies.list.useQuery({
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : (status as any),
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(0);
    setTimeout(() => setDebouncedSearch(v), 400);
  };

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <PageLayout title="Empresas" subtitle={`${data?.total ?? 0} empresas registradas`}>
      {/* Filters */}
      <div className="border-b border-border px-8 py-4 flex gap-4 items-center flex-wrap shrink-0">
        <div className="relative flex-1 min-w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar empresa..."
            className="pl-9 bg-input border-border font-mono text-sm h-9"
          />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="w-44 bg-input border-border font-mono text-xs h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="font-mono text-xs">Todos</SelectItem>
            <SelectItem value="pending" className="font-mono text-xs">Pendiente</SelectItem>
            <SelectItem value="processing" className="font-mono text-xs">Procesando</SelectItem>
            <SelectItem value="processed" className="font-mono text-xs">Procesado</SelectItem>
            <SelectItem value="error" className="font-mono text-xs">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="brutalista-label">Cargando...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 px-8 py-3 border-b border-border bg-muted">
              <span className="col-span-6 brutalista-label">Empresa</span>
              <span className="col-span-3 brutalista-label">Rubro</span>
              <span className="col-span-2 brutalista-label">Estado</span>
              <span className="col-span-1 brutalista-label text-right">Fecha</span>
            </div>
            <div className="divide-y divide-border">
              {data?.items.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <p className="brutalista-label">Sin resultados</p>
                </div>
              ) : (
                data?.items.map(company => (
                  <Link key={company.id} href={`/companies/${company.id}`} className="grid grid-cols-12 px-8 py-4 hover:bg-accent transition-colors group items-center">
                    <div className="col-span-6 flex items-center gap-3">
                      <Building2 size={14} className="text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground text-sm truncate">{company.name}</span>
                    </div>
                    <div className="col-span-3">
                      {company.rubro ? (
                        <span className="brutalista-tag">{company.rubro}</span>
                      ) : (
                        <span className="brutalista-label">—</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className={`brutalista-tag status-${company.status}`}>
                        {STATUS_LABELS[company.status] ?? company.status}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(company.updatedAt).toLocaleDateString("es-CL")}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-border px-8 py-4 flex items-center justify-between shrink-0">
          <span className="brutalista-label">Página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="border border-border px-3 py-1 font-mono text-xs disabled:opacity-30 hover:bg-accent transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="border border-border px-3 py-1 font-mono text-xs disabled:opacity-30 hover:bg-accent transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
