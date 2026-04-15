import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { RefreshCw, Loader2, CheckCircle, AlertCircle, Clock, Play, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/PageLayout";

export default function Admin() {
  const { isAuthenticated, user } = useAuth();
  const [syncLimit, setSyncLimit] = useState(50);

  const { data: stats, refetch: refetchStats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: jobs, refetch: refetchJobs } = trpc.admin.recentJobs.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 5000 });

  const syncMutation = trpc.admin.syncDrive.useMutation({
    onSuccess: (d) => { toast.success(`Sincronización iniciada: ${d.queued} documentos en cola`); refetchStats(); refetchJobs(); },
    onError: (e) => toast.error(e.message),
  });

  const processNextMutation = trpc.admin.processNext.useMutation({
    onSuccess: (d) => { toast.success(d.message); refetchStats(); refetchJobs(); },
    onError: (e) => toast.error(e.message),
  });

  const processAllMutation = trpc.admin.processAll.useMutation({
    onSuccess: (d) => { toast.success(d.message); refetchStats(); refetchJobs(); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <PageLayout title="Administración" subtitle="Acceso restringido">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Debes iniciar sesión para acceder al panel de administración</p>
            <a href={getLoginUrl()} className="bg-foreground text-background px-6 py-3 font-mono text-xs tracking-widest uppercase hover:bg-muted-foreground transition-colors">
              Iniciar Sesión
            </a>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Administración"
      subtitle={`Panel de control — ${user?.name ?? ""}`}
      actions={
        <Button
          onClick={() => refetchStats()}
          variant="outline"
          className="h-9 font-mono text-xs"
          disabled={statsLoading}
        >
          <RefreshCw size={12} className={`mr-2 ${statsLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      }
    >
      <div className="flex-1 overflow-auto p-8 space-y-8">
        {/* Stats Grid */}
        <div>
          <p className="brutalista-label mb-4">Estado del Sistema</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            {[
              { label: "Total Documentos", value: stats?.totalDocuments ?? "—", icon: <BarChart3 size={14} /> },
              { label: "Pendientes", value: stats?.pending ?? "—", icon: <Clock size={14} />, cls: "status-pending" },
              { label: "Procesados", value: stats?.processed ?? "—", icon: <CheckCircle size={14} />, cls: "status-processed" },
              { label: "Con Error", value: stats?.error ?? "—", icon: <AlertCircle size={14} />, cls: "status-error" },
            ].map((s, i) => (
              <div key={i} className="bg-card px-6 py-6">
                <div className={`flex items-center gap-2 brutalista-label mb-2 ${s.cls ?? ""}`}>
                  {s.icon} {s.label}
                </div>
                <p className="brutalista-heading text-4xl text-foreground">{String(s.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <p className="brutalista-label mb-4">Acciones de Sincronización</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {/* Sync Drive */}
            <div className="bg-card p-6 space-y-4">
              <div>
                <h3 className="font-bold text-foreground text-sm mb-1">Sincronizar Google Drive</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Escanea la carpeta de Drive y registra documentos nuevos en la base de datos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="brutalista-label shrink-0">Límite:</label>
                <input
                  type="number"
                  value={syncLimit}
                  onChange={e => setSyncLimit(parseInt(e.target.value) || 50)}
                  min={1}
                  max={500}
                  className="bg-input border border-border px-2 py-1 font-mono text-xs w-20 text-foreground"
                />
              </div>
              <Button
                onClick={() => syncMutation.mutate({ limit: syncLimit })}
                disabled={syncMutation.isPending}
                className="w-full bg-foreground text-background hover:bg-muted-foreground font-mono text-xs tracking-widest uppercase"
              >
                {syncMutation.isPending ? (
                  <><Loader2 size={12} className="mr-2 animate-spin" /> Sincronizando...</>
                ) : (
                  <><RefreshCw size={12} className="mr-2" /> Sincronizar</>
                )}
              </Button>
            </div>

            {/* Process Next */}
            <div className="bg-card p-6 space-y-4">
              <div>
                <h3 className="font-bold text-foreground text-sm mb-1">Procesar Siguiente</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Descarga y analiza el siguiente documento pendiente con IA.
                </p>
              </div>
              <Button
                onClick={() => processNextMutation.mutate()}
                disabled={processNextMutation.isPending || (stats?.pending ?? 0) === 0}
                variant="outline"
                className="w-full font-mono text-xs tracking-widest uppercase"
              >
                {processNextMutation.isPending ? (
                  <><Loader2 size={12} className="mr-2 animate-spin" /> Procesando...</>
                ) : (
                  <><Play size={12} className="mr-2" /> Procesar 1</>
                )}
              </Button>
            </div>

            {/* Process All */}
            <div className="bg-card p-6 space-y-4">
              <div>
                <h3 className="font-bold text-foreground text-sm mb-1">Procesar en Lote</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Procesa hasta 10 documentos pendientes en secuencia. Puede tomar varios minutos.
                </p>
              </div>
              <Button
                onClick={() => processAllMutation.mutate({ batchSize: 10 })}
                disabled={processAllMutation.isPending || (stats?.pending ?? 0) === 0}
                variant="outline"
                className="w-full font-mono text-xs tracking-widest uppercase"
              >
                {processAllMutation.isPending ? (
                  <><Loader2 size={12} className="mr-2 animate-spin" /> Procesando lote...</>
                ) : (
                  <><Play size={12} className="mr-2" /> Procesar 10</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div>
          <p className="brutalista-label mb-4">Actividad Reciente</p>
          <div className="border border-border">
            <div className="grid grid-cols-12 px-6 py-3 border-b border-border bg-muted">
              <span className="col-span-5 brutalista-label">Documento</span>
              <span className="col-span-2 brutalista-label">Estado</span>
              <span className="col-span-3 brutalista-label">Empresa</span>
              <span className="col-span-2 brutalista-label text-right">Fecha</span>
            </div>
            {!jobs || jobs.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="brutalista-label">Sin actividad reciente</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {jobs.map(job => (
                  <div key={job.id} className="grid grid-cols-12 px-6 py-4 items-center">
                    <div className="col-span-5 truncate">
                      <span className="font-mono text-xs text-foreground truncate">{job.driveFileName ?? job.driveFileId}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={`brutalista-tag status-${job.status}`}>{job.status}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-muted-foreground text-xs truncate">{job.companyId ?? "—"}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(job.updatedAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
