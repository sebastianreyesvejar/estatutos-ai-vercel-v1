import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { RefreshCw, Loader2, CheckCircle, AlertCircle, Clock, Play, BarChart3, FolderSync, Zap, Database } from "lucide-react";
import PageLayout from "@/components/PageLayout";

export default function Admin() {
  const { isAuthenticated, user } = useAuth();
  const [syncLimit, setSyncLimit] = useState(50);

  const isAdmin = user?.role === 'admin';
  const { data: stats, refetch: refetchStats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const { data: jobs, refetch: refetchJobs } = trpc.admin.recentJobs.useQuery(undefined, { enabled: isAdmin, refetchInterval: 5000 });

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
      <PageLayout title="Administración" subtitle="Acceso restringido" headerColor="orange">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "oklch(0.68 0.19 40 / 0.1)" }}>
              <AlertCircle size={28} style={{ color: "oklch(0.68 0.19 40)" }} />
            </div>
            <p className="font-semibold text-gray-600 mb-4">Debes iniciar sesión para acceder al panel de administración</p>
            <a href={getLoginUrl()} className="btn-pill btn-orange inline-flex items-center gap-2">
              Iniciar Sesión
            </a>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isAdmin) {
    return (
      <PageLayout title="Administración" subtitle="Acceso restringido" headerColor="orange">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "oklch(0.55 0.20 25 / 0.1)" }}>
              <AlertCircle size={28} style={{ color: "oklch(0.55 0.20 25)" }} />
            </div>
            <p className="font-bold text-lg mb-2" style={{ color: "oklch(0.18 0.06 270)" }}>Acceso denegado</p>
            <p className="text-gray-400 text-sm">Esta sección está reservada para administradores del sistema.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Administración"
      subtitle={`Panel de control — ${user?.name ?? ""}`}
      headerColor="orange"
      actions={
        <button
          onClick={() => refetchStats()}
          disabled={statsLoading}
          className="btn-pill inline-flex items-center gap-2 text-sm px-4 py-2"
          style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
        >
          <RefreshCw size={14} className={statsLoading ? "animate-spin" : ""} />
          Actualizar
        </button>
      }
    >
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Stats Grid */}
          <div>
            <p className="evo-label mb-4">Estado del Sistema</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Documentos", value: stats?.totalDocuments ?? "—", icon: <BarChart3 size={20} />, color: "evo-icon-teal", valueColor: "oklch(0.68 0.13 210)" },
                { label: "Pendientes", value: stats?.pending ?? "—", icon: <Clock size={20} />, color: "evo-icon-orange", valueColor: "oklch(0.68 0.19 40)" },
                { label: "Procesados", value: stats?.processed ?? "—", icon: <CheckCircle size={20} />, color: "evo-icon-green", valueColor: "oklch(0.45 0.15 145)" },
                { label: "Con Error", value: stats?.error ?? "—", icon: <AlertCircle size={20} />, color: "evo-icon-purple", valueColor: "oklch(0.55 0.20 25)" },
              ].map((s, i) => (
                <div key={i} className="evo-card">
                  <div className={`evo-icon ${s.color} mb-3`}>{s.icon}</div>
                  <p className="text-3xl font-black mb-1" style={{ fontFamily: "'Nunito', sans-serif", color: s.valueColor }}>
                    {String(s.value)}
                  </p>
                  <p className="text-sm font-semibold text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <p className="evo-label mb-4">Acciones de Sincronización</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Sync Drive */}
              <div className="evo-card space-y-4">
                <div className="evo-icon evo-icon-teal mb-2">
                  <FolderSync size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ color: "oklch(0.18 0.06 270)", fontFamily: "'Nunito', sans-serif" }}>
                    Sincronizar Google Drive
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Escanea la carpeta de Drive y registra documentos nuevos en la base de datos.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500 shrink-0">Límite:</label>
                  <input
                    type="number"
                    value={syncLimit}
                    onChange={e => setSyncLimit(parseInt(e.target.value) || 50)}
                    min={1}
                    max={500}
                    className="border rounded-lg px-2 py-1 text-sm w-20 font-medium"
                    style={{ border: "1.5px solid oklch(0.90 0.03 210)" }}
                  />
                </div>
                <button
                  onClick={() => syncMutation.mutate({ limit: syncLimit })}
                  disabled={syncMutation.isPending}
                  className="btn-pill btn-teal w-full justify-center text-sm disabled:opacity-50"
                >
                  {syncMutation.isPending ? (
                    <><Loader2 size={14} className="animate-spin" /> Sincronizando...</>
                  ) : (
                    <><RefreshCw size={14} /> Sincronizar</>
                  )}
                </button>
              </div>

              {/* Process Next */}
              <div className="evo-card space-y-4">
                <div className="evo-icon evo-icon-orange mb-2">
                  <Play size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ color: "oklch(0.18 0.06 270)", fontFamily: "'Nunito', sans-serif" }}>
                    Procesar Siguiente
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Descarga y analiza el siguiente documento pendiente con IA.
                  </p>
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => processNextMutation.mutate()}
                    disabled={processNextMutation.isPending || (stats?.pending ?? 0) === 0}
                    className="btn-pill btn-orange w-full justify-center text-sm disabled:opacity-50"
                  >
                    {processNextMutation.isPending ? (
                      <><Loader2 size={14} className="animate-spin" /> Procesando...</>
                    ) : (
                      <><Play size={14} /> Procesar 1</>
                    )}
                  </button>
                </div>
              </div>

              {/* Process All */}
              <div className="evo-card space-y-4">
                <div className="evo-icon evo-icon-purple mb-2">
                  <Zap size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ color: "oklch(0.18 0.06 270)", fontFamily: "'Nunito', sans-serif" }}>
                    Procesar en Lote
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Procesa hasta 10 documentos pendientes en secuencia. Puede tomar varios minutos.
                  </p>
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => processAllMutation.mutate({ batchSize: 10 })}
                    disabled={processAllMutation.isPending || (stats?.pending ?? 0) === 0}
                    className="btn-pill w-full justify-center text-sm disabled:opacity-50"
                    style={{ background: "oklch(0.65 0.15 300 / 0.12)", color: "oklch(0.45 0.15 300)", border: "1.5px solid oklch(0.65 0.15 300 / 0.3)" }}
                  >
                    {processAllMutation.isPending ? (
                      <><Loader2 size={14} className="animate-spin" /> Procesando lote...</>
                    ) : (
                      <><Zap size={14} /> Procesar 10</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Jobs */}
          <div>
            <p className="evo-label mb-4">Actividad Reciente</p>
            <div className="evo-card p-0 overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 border-b" style={{ background: "oklch(0.96 0.02 210)", borderColor: "oklch(0.90 0.03 210)" }}>
                <span className="col-span-5 text-xs font-bold uppercase tracking-wider text-gray-500">Documento</span>
                <span className="col-span-2 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</span>
                <span className="col-span-3 text-xs font-bold uppercase tracking-wider text-gray-500">Empresa ID</span>
                <span className="col-span-2 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Fecha</span>
              </div>
              {!jobs || jobs.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "oklch(0.68 0.13 210 / 0.1)" }}>
                    <Database size={20} style={{ color: "oklch(0.68 0.13 210)" }} />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Sin actividad reciente</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "oklch(0.93 0.02 210)" }}>
                  {jobs.map(job => (
                    <div key={job.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-5 truncate">
                        <span className="text-sm font-medium text-gray-700 truncate">{job.driveFileName ?? job.driveFileId}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={`status-${job.status}`}>{job.status}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-gray-400 text-xs">{job.companyId ?? "—"}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs text-gray-400">
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
      </div>
    </PageLayout>
  );
}
