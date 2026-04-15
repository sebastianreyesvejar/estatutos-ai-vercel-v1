import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Plus, FileText, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageLayout from "@/components/PageLayout";

export default function Drafts() {
  const { isAuthenticated, user } = useAuth();
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
      <PageLayout title="Redactor Inteligente" subtitle="Genera borradores de estatutos con IA">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Debes iniciar sesión para usar el redactor</p>
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
      title="Redactor Inteligente"
      subtitle="Borradores de estatutos generados con IA"
      actions={
        <Button
          onClick={() => setShowNew(true)}
          className="bg-foreground text-background hover:bg-muted-foreground font-mono text-xs tracking-widest uppercase h-9"
        >
          <Plus size={14} className="mr-2" /> Nuevo Borrador
        </Button>
      }
    >
      {/* Drafts list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="brutalista-label">Cargando...</p>
          </div>
        ) : !drafts || drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <FileText size={32} className="text-muted-foreground" />
            <p className="brutalista-label">Sin borradores aún</p>
            <Button onClick={() => setShowNew(true)} variant="outline" className="font-mono text-xs tracking-widest uppercase">
              Crear primer borrador
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {drafts.map(draft => (
              <div key={draft.id} className="flex items-center justify-between px-8 py-5 hover:bg-accent transition-colors group">
                <Link href={`/drafts/${draft.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-foreground text-sm">{draft.title ?? draft.companyName ?? "Sin título"}</span>
                    {draft.rubro && <span className="brutalista-tag">{draft.rubro}</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="brutalista-label">{draft.companyName}</span>
                    <span className="brutalista-label">{new Date(draft.createdAt).toLocaleDateString("es-CL")}</span>
                    {draft.generatedFullStatute && <span className="brutalista-tag status-processed">Estatuto completo</span>}
                    {draft.generatedSocialObject && !draft.generatedFullStatute && <span className="brutalista-tag status-processing">Objeto social</span>}
                  </div>
                </Link>
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/drafts/${draft.id}`} className="border border-border px-3 py-1.5 font-mono text-xs hover:bg-accent transition-colors flex items-center gap-1">
                    Abrir <ArrowRight size={12} />
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate({ id: draft.id })}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Draft Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="brutalista-heading text-2xl">Nuevo Borrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="brutalista-label block mb-2">Nombre de la empresa *</label>
              <Input
                value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                placeholder="Ej: Tecnología del Sur SpA"
                className="bg-input border-border font-mono text-sm"
              />
            </div>
            <div>
              <label className="brutalista-label block mb-2">Rubro *</label>
              <Input
                value={form.rubro}
                onChange={e => setForm(f => ({ ...f, rubro: e.target.value }))}
                placeholder="Ej: Tecnología, Construcción, Comercio..."
                className="bg-input border-border font-mono text-sm"
              />
            </div>
            <div>
              <label className="brutalista-label block mb-2">Descripción de actividades *</label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe las actividades principales de la empresa..."
                className="bg-input border-border font-mono text-sm min-h-32 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => generateMutation.mutate({ ...form, useExistingContext: true })}
                disabled={!form.companyName || !form.rubro || !form.description || generateMutation.isPending}
                className="flex-1 bg-foreground text-background hover:bg-muted-foreground font-mono text-xs tracking-widest uppercase"
              >
                {generateMutation.isPending ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" /> Generando...</>
                ) : (
                  "Generar con IA"
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)} className="font-mono text-xs">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
