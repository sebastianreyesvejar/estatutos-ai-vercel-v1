import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, Zap, FileText, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Streamdown } from "streamdown";
import PageLayout from "@/components/PageLayout";

export default function DraftDetail() {
  const { id } = useParams<{ id: string }>();
  const draftId = parseInt(id ?? "0");

  const { data: draft, isLoading, refetch } = trpc.drafts.byId.useQuery({ id: draftId });
  const [editSocialObject, setEditSocialObject] = useState<string | null>(null);
  const [editFullStatute, setEditFullStatute] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [showAdditional, setShowAdditional] = useState(false);

  const updateMutation = trpc.drafts.update.useMutation({
    onSuccess: () => { toast.success("Guardado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const generateFullMutation = trpc.drafts.generateFullStatute.useMutation({
    onSuccess: () => { toast.success("Estatuto completo generado"); refetch(); setShowAdditional(false); },
    onError: (e) => toast.error(e.message),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  if (isLoading) {
    return (
      <PageLayout title="Cargando..." backHref="/drafts" backLabel="Borradores">
        <div className="flex items-center justify-center h-64">
          <p className="brutalista-label">Cargando borrador...</p>
        </div>
      </PageLayout>
    );
  }

  if (!draft) {
    return (
      <PageLayout title="No encontrado" backHref="/drafts" backLabel="Borradores">
        <div className="flex items-center justify-center h-64">
          <p className="brutalista-label">Borrador no encontrado</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={draft.title ?? draft.companyName ?? "Borrador"}
      subtitle={draft.rubro ?? ""}
      backHref="/drafts"
      backLabel="Borradores"
    >
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border min-h-full">
          {/* Left: Social Object */}
          <div className="p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="brutalista-label">Objeto Social</p>
              <div className="flex gap-2">
                {draft.generatedSocialObject && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 font-mono text-xs"
                    onClick={() => copyToClipboard(draft.generatedSocialObject!)}
                  >
                    <Copy size={12} className="mr-1" /> Copiar
                  </Button>
                )}
                {editSocialObject !== null ? (
                  <Button
                    size="sm"
                    className="h-7 font-mono text-xs bg-foreground text-background hover:bg-muted-foreground"
                    onClick={() => {
                      updateMutation.mutate({ id: draftId, generatedSocialObject: editSocialObject });
                      setEditSocialObject(null);
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <Save size={12} className="mr-1" /> Guardar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 font-mono text-xs"
                    onClick={() => setEditSocialObject(draft.generatedSocialObject ?? "")}
                  >
                    Editar
                  </Button>
                )}
              </div>
            </div>

            {editSocialObject !== null ? (
              <Textarea
                value={editSocialObject}
                onChange={e => setEditSocialObject(e.target.value)}
                className="flex-1 bg-input border-border font-mono text-sm resize-none min-h-96"
              />
            ) : draft.generatedSocialObject ? (
              <div className="border border-border p-6 flex-1 overflow-auto">
                <div className="prose prose-invert prose-sm max-w-none text-foreground leading-relaxed">
                  <Streamdown>{draft.generatedSocialObject}</Streamdown>
                </div>
              </div>
            ) : (
              <div className="border border-border p-8 text-center flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Sin objeto social generado</p>
              </div>
            )}

            {/* Generate full statute */}
            {draft.generatedSocialObject && (
              <div className="border-t border-border pt-4">
                {!showAdditional ? (
                  <Button
                    onClick={() => setShowAdditional(true)}
                    disabled={generateFullMutation.isPending}
                    className="w-full bg-foreground text-background hover:bg-muted-foreground font-mono text-xs tracking-widest uppercase"
                  >
                    <Zap size={14} className="mr-2" />
                    Generar Estatuto Completo
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <label className="brutalista-label block">Información adicional (opcional)</label>
                    <Textarea
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                      placeholder="Capital inicial, número de accionistas, domicilio, etc."
                      className="bg-input border-border font-mono text-sm min-h-24 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => generateFullMutation.mutate({ draftId, additionalInfo: additionalInfo || undefined })}
                        disabled={generateFullMutation.isPending}
                        className="flex-1 bg-foreground text-background hover:bg-muted-foreground font-mono text-xs tracking-widest uppercase"
                      >
                        {generateFullMutation.isPending ? (
                          <><Loader2 size={14} className="mr-2 animate-spin" /> Generando...</>
                        ) : (
                          <><Zap size={14} className="mr-2" /> Generar</>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAdditional(false)} className="font-mono text-xs">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Full Statute */}
          <div className="p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="brutalista-label">Estatuto Completo</p>
              <div className="flex gap-2">
                {draft.generatedFullStatute && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 font-mono text-xs"
                    onClick={() => copyToClipboard(draft.generatedFullStatute!)}
                  >
                    <Copy size={12} className="mr-1" /> Copiar
                  </Button>
                )}
                {editFullStatute !== null ? (
                  <Button
                    size="sm"
                    className="h-7 font-mono text-xs bg-foreground text-background hover:bg-muted-foreground"
                    onClick={() => {
                      updateMutation.mutate({ id: draftId, generatedFullStatute: editFullStatute });
                      setEditFullStatute(null);
                    }}
                    disabled={updateMutation.isPending}
                  >
                    <Save size={12} className="mr-1" /> Guardar
                  </Button>
                ) : draft.generatedFullStatute ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 font-mono text-xs"
                    onClick={() => setEditFullStatute(draft.generatedFullStatute ?? "")}
                  >
                    Editar
                  </Button>
                ) : null}
              </div>
            </div>

            {editFullStatute !== null ? (
              <Textarea
                value={editFullStatute}
                onChange={e => setEditFullStatute(e.target.value)}
                className="flex-1 bg-input border-border font-mono text-sm resize-none min-h-96"
              />
            ) : draft.generatedFullStatute ? (
              <div className="border border-border p-6 flex-1 overflow-auto">
                <div className="prose prose-invert prose-sm max-w-none text-foreground leading-relaxed">
                  <Streamdown>{draft.generatedFullStatute}</Streamdown>
                </div>
              </div>
            ) : (
              <div className="border border-border p-8 text-center flex-1 flex items-center justify-center flex-col gap-3">
                <FileText size={32} className="text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {draft.generatedSocialObject
                    ? "Genera el estatuto completo usando el botón de la izquierda"
                    : "Primero genera el objeto social"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
