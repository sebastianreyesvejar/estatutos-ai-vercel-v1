import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Plus, FileText, Trash2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageLayout from "@/components/PageLayout";

export default function Drafts() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ companyName: "", rubro: "", description: "" });

  const { data: drafts, isLoading, refetch } = trpc.drafts.list.useQuery(undefined, { enabled: isAuthenticated });
  const generateMutation = trpc.drafts.generateSocialObject.useMutation({
    onSuccess: (data) => {
      toast.success("Objeto social generado");
      setShowNew(false);
      navigate(`/drafts/${data.draftId}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.drafts.delete.useMutation({
    onSuccess: () => { toast.success("Borrador eliminado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <PageLayout title="Redactor Inteligente" subtitle="Genera borradores de estatutos con IA" headerColor="orange">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "oklch(0.68 0.19 40 / 0.1)" }}>
              <Sparkles size={28} style={{ color: "oklch(0.68 0.19 40)" }} />
            </div>
            <p className="font-semibold text-gray-600 mb-4">Debes iniciar sesión para usar el redactor</p>
            <a href={getLoginUrl()} className="btn-pill btn-orange inline-flex items-center gap-2">
              Iniciar Sesión
            </a>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Redactor Inteligente"
      subtitle="Borradores de estatutos generados con IA"
      headerColor="orange"
      actions={
        <button
          onClick={() => setShowNew(true)}
          className="btn-pill btn-outline-orange inline-flex items-center gap-2 text-sm"
          style={{ borderColor: "rgba(255,255,255,0.5)", color: "white", background: "rgba(255,255,255,0.15)" }}
        >
          <Plus size={16} /> Nuevo Borrador
        </button>
      }
    >
      {/* Drafts list */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse" style={{ background: "oklch(0.68 0.19 40 / 0.15)" }}>
                  <Sparkles size={20} style={{ color: "oklch(0.68 0.19 40)" }} />
                </div>
                <p className="text-sm font-medium text-gray-400">Cargando borradores...</p>
              </div>
            </div>
          ) : !drafts || drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "oklch(0.68 0.19 40 / 0.1)" }}>
                <FileText size={36} style={{ color: "oklch(0.68 0.19 40)" }} />
              </div>
              <div className="text-center">
                <p className="font-bold text-xl mb-1" style={{ color: "oklch(0.18 0.06 270)", fontFamily: "'Nunito', sans-serif" }}>
                  Sin borradores aún
                </p>
                <p className="text-gray-400 text-sm mb-4">Crea tu primer borrador de estatuto con IA</p>
              </div>
              <button onClick={() => setShowNew(true)} className="btn-pill btn-orange inline-flex items-center gap-2">
                <Plus size={16} /> Crear primer borrador
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {drafts.map(draft => (
                <div key={draft.id} className="evo-card flex items-center justify-between gap-4">
                  <Link href={`/drafts/${draft.id}`} className="flex-1 min-w-0 cursor-pointer">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-bold text-base" style={{ color: "oklch(0.18 0.06 270)", fontFamily: "'Nunito', sans-serif" }}>
                        {draft.title ?? draft.companyName ?? "Sin título"}
                      </span>
                      {draft.rubro && <span className="evo-badge evo-badge-orange">{draft.rubro}</span>}
                      {draft.generatedFullStatute && <span className="status-processed">Estatuto completo</span>}
                      {draft.generatedSocialObject && !draft.generatedFullStatute && <span className="status-processing">Objeto social</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{draft.companyName}</span>
                      <span className="text-xs text-gray-400">{new Date(draft.createdAt).toLocaleDateString("es-CL")}</span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Link href={`/drafts/${draft.id}`} className="btn-pill btn-teal inline-flex items-center gap-1 text-xs px-3 py-1.5">
                      Abrir <ArrowRight size={12} />
                    </Link>
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-red-50"
                      style={{ color: "oklch(0.55 0.20 25)" }}
                      onClick={() => deleteMutation.mutate({ id: draft.id })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Draft Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg" style={{ fontFamily: "'Poppins', sans-serif", borderRadius: "20px" }}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.68 0.19 40)" }}>
                <Sparkles size={18} color="white" />
              </div>
              <DialogTitle className="text-xl font-black" style={{ fontFamily: "'Nunito', sans-serif", color: "oklch(0.18 0.06 270)" }}>
                Nuevo Borrador
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Nombre de la empresa *</label>
              <Input
                value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                placeholder="Ej: Tecnología del Sur SpA"
                className="rounded-xl text-sm"
                style={{ border: "1.5px solid oklch(0.90 0.03 210)" }}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Rubro *</label>
              <Input
                value={form.rubro}
                onChange={e => setForm(f => ({ ...f, rubro: e.target.value }))}
                placeholder="Ej: Tecnología, Construcción, Comercio..."
                className="rounded-xl text-sm"
                style={{ border: "1.5px solid oklch(0.90 0.03 210)" }}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Descripción de actividades *</label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe las actividades principales de la empresa..."
                className="rounded-xl text-sm min-h-28 resize-none"
                style={{ border: "1.5px solid oklch(0.90 0.03 210)" }}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => generateMutation.mutate({ ...form, useExistingContext: true })}
                disabled={!form.companyName || !form.rubro || !form.description || generateMutation.isPending}
                className="btn-pill btn-orange flex-1 justify-center text-sm disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Generando...</>
                ) : (
                  <><Sparkles size={14} /> Generar con IA</>
                )}
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="btn-pill text-sm px-4"
                style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
