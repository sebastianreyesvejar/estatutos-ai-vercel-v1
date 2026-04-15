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
    <PageLayout title="Empresas" subtitle={`${data?.total ?? 0} empresas registradas`} headerColor="navy">

      {/* Filters */}
      <div className="px-6 py-4 border-b" style={{ background: "white", borderColor: "oklch(0.93 0.02 210)" }}>
        <div className="max-w-6xl mx-auto flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.68 0.13 210)" }} />
            <Input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar empresa..."
              className="pl-9 text-sm h-10 rounded-xl"
              style={{ border: "1.5px solid oklch(0.90 0.03 210)", fontFamily: "'Poppins', sans-serif" }}
            />
          </div>
          <Select value={status} onValueChange={v => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-44 h-10 rounded-xl text-sm" style={{ border: "1.5px solid oklch(0.90 0.03 210)" }}>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="processing">Procesando</SelectItem>
              <SelectItem value="processed">Procesado</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse" style={{ background: "oklch(0.18 0.06 270 / 0.1)" }}>
                  <Building2 size={20} style={{ color: "oklch(0.18 0.06 270)" }} />
                </div>
                <p className="text-sm font-medium text-gray-400">Cargando empresas...</p>
              </div>
            </div>
          ) : (
            <div className="evo-card p-0 overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 border-b" style={{ background: "oklch(0.96 0.02 210)", borderColor: "oklch(0.90 0.03 210)" }}>
                <span className="col-span-6 text-xs font-bold uppercase tracking-wider text-gray-500">Empresa</span>
                <span className="col-span-3 text-xs font-bold uppercase tracking-wider text-gray-500">Rubro</span>
                <span className="col-span-2 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</span>
                <span className="col-span-1 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Fecha</span>
              </div>
              <div className="divide-y" style={{ borderColor: "oklch(0.93 0.02 210)" }}>
                {data?.items.length === 0 ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <Building2 size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-medium text-gray-400">Sin resultados</p>
                    </div>
                  </div>
                ) : (
                  data?.items.map(company => (
                    <Link key={company.id} href={`/companies/${company.id}`}
                      className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors items-center cursor-pointer">
                      <div className="col-span-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.18 0.06 270 / 0.08)" }}>
                          <Building2 size={14} style={{ color: "oklch(0.18 0.06 270)" }} />
                        </div>
                        <span className="font-semibold text-sm truncate" style={{ color: "oklch(0.18 0.06 270)" }}>{company.name}</span>
                      </div>
                      <div className="col-span-3">
                        {company.rubro ? (
                          <span className="evo-badge evo-badge-teal">{company.rubro}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className={`status-${company.status}`}>
                          {STATUS_LABELS[company.status] ?? company.status}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-xs text-gray-400">
                          {new Date(company.updatedAt).toLocaleDateString("es-CL")}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
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
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="btn-pill btn-outline-orange px-3 py-1.5 text-xs disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="btn-pill btn-orange px-3 py-1.5 text-xs disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
