import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, Zap, FileText, Copy, Edit3, X } from "lucide-react";
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
      <PageLayout title="Cargando..." backHref="/drafts" backLabel="Borradores" headerColor="orange">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse" style={{ background: "oklch(0.68 0.19 40 / 0.15)" }}>
              <FileText size={20} style={{ color: "oklch(0.68 0.19 40)" }} />
            </div>
            <p className="text-sm font-medium text-gray-400">Cargando borrador...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!draft) {
    return (
      <PageLayout title="No encontrado" backHref="/drafts" backLabel="Borradores" headerColor="orange">
        <div className="flex items-center justify-center h-64">
          <p className="text-sm font-medium text-gray-400">Borrador no encontrado</p>
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
      headerColor="orange"
    >
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-full">

          {/* Left: Social Object */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="evo-label">Objeto Social</p>
              <div className="flex gap-2">
                {draft.generatedSocialObject && (
                  <button
                    className="btn-pill text-xs px-3 py-1.5 inline-flex items-center gap-1"
                    style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
                    onClick={() => copyToClipboard(draft.generatedSocialObject!)}
                  >
                    <Copy size={11} /> Copiar
                  </button>
                )}
                {editSocialObject !== null ? (
                  <>
                    <button
                      className="btn-pill btn-teal text-xs px-3 py-1.5 inline-flex items-center gap-1"
                      onClick={() => {
                        updateMutation.mutate({ id: draftId, generatedSocialObject: editSocialObject });
                        setEditSocialObject(null);
                      }}
                      disabled={updateMutation.isPending}
                    >
                      <Save size={11} /> Guardar
                    </button>
                    <button
                      className="btn-pill text-xs px-3 py-1.5"
                      style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
                      onClick={() => setEditSocialObject(null)}
                    >
                      <X size={11} />
                    </button>
                  </>
                ) : draft.generatedSocialObject ? (
                  <button
                    className="btn-pill text-xs px-3 py-1.5 inline-flex items-center gap-1"
                    style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
                    onClick={() => setEditSocialObject(draft.generatedSocialObject ?? "")}
                  >
                    <Edit3 size={11} /> Editar
                  </button>
                ) : null}
              </div>
            </div>

            {editSocialObject !== null ? (
              <Textarea
                value={editSocialObject}
                onChange={e => setEditSocialObject(e.target.value)}
                className="flex-1 text-sm resize-none min-h-96 rounded-xl"
                style={{ border: "1.5px solid oklch(0.90 0.03 210)", fontFamily: "'Poppins', sans-serif" }}
              />
            ) : draft.generatedSocialObject ? (
              <div className="evo-card flex-1 overflow-auto">
                <div className="prose prose-sm max-w-none leading-relaxed" style={{ color: "oklch(0.18 0.06 270)" }}>
                  <Streamdown>{draft.generatedSocialObject}</Streamdown>
                </div>
              </div>
            ) : (
              <div className="evo-card flex-1 flex items-center justify-center text-center py-12">
                <div>
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "oklch(0.68 0.19 40 / 0.1)" }}>
                    <FileText size={20} style={{ color: "oklch(0.68 0.19 40)" }} />
                  </div>
                  <p className="text-sm text-gray-400">Sin objeto social generado</p>
                </div>
              </div>
            )}

            {/* Generate full statute */}
            {draft.generatedSocialObject && (
              <div className="border-t pt-4" style={{ borderColor: "oklch(0.90 0.03 210)" }}>
                {!showAdditional ? (
                  <button
                    onClick={() => setShowAdditional(true)}
                    disabled={generateFullMutation.isPending}
                    className="btn-pill btn-orange w-full justify-center text-sm disabled:opacity-50"
                  >
                    <Zap size={14} /> Generar Estatuto Completo
                  </button>
                ) : (
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                      Información adicional (opcional)
                    </label>
                    <Textarea
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                      placeholder="Capital inicial, número de accionistas, domicilio, etc."
                      className="text-sm min-h-24 resize-none rounded-xl"
                      style={{ border: "1.5px solid oklch(0.90 0.03 210)" }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateFullMutation.mutate({ draftId, additionalInfo: additionalInfo || undefined })}
                        disabled={generateFullMutation.isPending}
                        className="btn-pill btn-orange flex-1 justify-center text-sm disabled:opacity-50"
                      >
                        {generateFullMutation.isPending ? (
                          <><Loader2 size={14} className="animate-spin" /> Generando...</>
                        ) : (
                          <><Zap size={14} /> Generar</>
                        )}
                      </button>
                      <button
                        onClick={() => setShowAdditional(false)}
                        className="btn-pill text-sm px-4"
                        style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Full Statute */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="evo-label">Estatuto Completo</p>
              <div className="flex gap-2">
                {draft.generatedFullStatute && (
                  <button
                    className="btn-pill text-xs px-3 py-1.5 inline-flex items-center gap-1"
                    style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
                    onClick={() => copyToClipboard(draft.generatedFullStatute!)}
                  >
                    <Copy size={11} /> Copiar
                  </button>
                )}
                {editFullStatute !== null ? (
                  <>
                    <button
                      className="btn-pill btn-teal text-xs px-3 py-1.5 inline-flex items-center gap-1"
                      onClick={() => {
                        updateMutation.mutate({ id: draftId, generatedFullStatute: editFullStatute });
                        setEditFullStatute(null);
                      }}
                      disabled={updateMutation.isPending}
                    >
                      <Save size={11} /> Guardar
                    </button>
                    <button
                      className="btn-pill text-xs px-3 py-1.5"
                      style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
                      onClick={() => setEditFullStatute(null)}
                    >
                      <X size={11} />
                    </button>
                  </>
                ) : draft.generatedFullStatute ? (
                  <button
                    className="btn-pill text-xs px-3 py-1.5 inline-flex items-center gap-1"
                    style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
                    onClick={() => setEditFullStatute(draft.generatedFullStatute ?? "")}
                  >
                    <Edit3 size={11} /> Editar
                  </button>
                ) : null}
              </div>
            </div>

            {editFullStatute !== null ? (
              <Textarea
                value={editFullStatute}
                onChange={e => setEditFullStatute(e.target.value)}
                className="flex-1 text-sm resize-none min-h-96 rounded-xl"
                style={{ border: "1.5px solid oklch(0.90 0.03 210)", fontFamily: "'Poppins', sans-serif" }}
              />
            ) : draft.generatedFullStatute ? (
              <div className="evo-card flex-1 overflow-auto">
                <div className="prose prose-sm max-w-none leading-relaxed" style={{ color: "oklch(0.18 0.06 270)" }}>
                  <Streamdown>{draft.generatedFullStatute}</Streamdown>
                </div>
              </div>
            ) : (
              <div className="evo-card flex-1 flex items-center justify-center text-center py-12 flex-col gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "oklch(0.68 0.13 210 / 0.1)" }}>
                  <FileText size={28} style={{ color: "oklch(0.68 0.13 210)" }} />
                </div>
                <p className="text-sm text-gray-400">
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
