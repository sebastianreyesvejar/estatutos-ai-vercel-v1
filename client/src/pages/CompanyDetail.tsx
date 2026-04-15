import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, ExternalLink, FileText, Edit3, Save, X, Building2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/PageLayout";

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const companyId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();

  const { data, isLoading, refetch } = trpc.companies.byId.useQuery({ id: companyId });
  const validateMutation = trpc.socialObjects.validate.useMutation({
    onSuccess: () => { toast.success("Validación guardada"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  if (isLoading) {
    return (
      <PageLayout title="Cargando..." backHref="/companies" backLabel="Empresas" headerColor="navy">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse" style={{ background: "oklch(0.18 0.06 270 / 0.1)" }}>
              <Building2 size={20} style={{ color: "oklch(0.18 0.06 270)" }} />
            </div>
            <p className="text-sm font-medium text-gray-400">Cargando empresa...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout title="No encontrado" backHref="/companies" backLabel="Empresas" headerColor="navy">
        <div className="flex items-center justify-center h-64">
          <p className="text-sm font-medium text-gray-400">Empresa no encontrada</p>
        </div>
      </PageLayout>
    );
  }

  const { company, documents, socialObjects } = data;

  return (
    <PageLayout
      title={company.name}
      subtitle={company.rubro ?? "Rubro no identificado"}
      backHref="/companies"
      backLabel="Empresas"
      headerColor="navy"
    >
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Documents */}
          <div>
            <p className="evo-label mb-4">Documentos ({documents.length})</p>
            {documents.length === 0 ? (
              <div className="evo-card text-center py-8">
                <FileText size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">Sin documentos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="evo-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.18 0.06 270 / 0.08)" }}>
                          <FileText size={12} style={{ color: "oklch(0.18 0.06 270)" }} />
                        </div>
                        <span className="text-sm font-medium truncate" style={{ color: "oklch(0.18 0.06 270)" }}>
                          {doc.driveFileName ?? "Documento"}
                        </span>
                      </div>
                      {doc.driveWebViewLink && (
                        <a href={doc.driveWebViewLink} target="_blank" rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className={`status-${doc.status}`}>{doc.status}</span>
                    </div>
                    {doc.errorMessage && (
                      <p className="text-xs mt-2 font-mono" style={{ color: "oklch(0.55 0.20 25)" }}>{doc.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Social Objects */}
          <div className="lg:col-span-2">
            <p className="evo-label mb-4">Objetos Sociales Extraídos ({socialObjects.length})</p>
            {socialObjects.length === 0 ? (
              <div className="evo-card text-center py-12">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "oklch(0.68 0.13 210 / 0.1)" }}>
                  <FileText size={28} style={{ color: "oklch(0.68 0.13 210)" }} />
                </div>
                <p className="font-bold text-base mb-1" style={{ color: "oklch(0.18 0.06 270)", fontFamily: "'Nunito', sans-serif" }}>
                  Sin objetos sociales
                </p>
                <p className="text-gray-400 text-sm">El documento debe ser procesado primero desde el panel de Admin.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {socialObjects.map(so => (
                  <div key={so.id} className="evo-card p-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b" style={{ background: "oklch(0.96 0.02 210)", borderColor: "oklch(0.90 0.03 210)" }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        {so.rubro && <span className="evo-badge evo-badge-teal">{so.rubro}</span>}
                        {so.extractionConfidence && (
                          <span className={`status-${so.extractionConfidence === 'high' ? 'processed' : so.extractionConfidence === 'medium' ? 'processing' : 'error'}`}>
                            Confianza: {so.extractionConfidence}
                          </span>
                        )}
                        {so.isValidated && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "oklch(0.45 0.15 145)" }}>
                            <CheckCircle size={11} /> Validado
                          </span>
                        )}
                      </div>
                      {isAuthenticated && (
                        <div className="flex gap-2">
                          {editingId === so.id ? (
                            <>
                              <button
                                className="btn-pill btn-teal text-xs px-3 py-1.5 inline-flex items-center gap-1"
                                onClick={() => {
                                  validateMutation.mutate({ id: so.id, manualOverride: editText, isValidated: true });
                                  setEditingId(null);
                                }}
                              >
                                <Save size={11} /> Guardar
                              </button>
                              <button
                                className="btn-pill text-xs px-3 py-1.5"
                                style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
                                onClick={() => setEditingId(null)}
                              >
                                <X size={11} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn-pill text-xs px-3 py-1.5 inline-flex items-center gap-1"
                                style={{ background: "oklch(0.95 0 0)", color: "oklch(0.45 0 0)" }}
                                onClick={() => { setEditingId(so.id); setEditText(so.manualOverride ?? so.structuredText ?? so.rawText); }}
                              >
                                <Edit3 size={11} /> Editar
                              </button>
                              {!so.isValidated && (
                                <button
                                  className="btn-pill btn-orange text-xs px-3 py-1.5 inline-flex items-center gap-1"
                                  onClick={() => validateMutation.mutate({ id: so.id, isValidated: true })}
                                >
                                  <CheckCircle size={11} /> Validar
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {editingId === so.id ? (
                        <Textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="text-sm min-h-48 resize-y rounded-xl"
                          style={{ border: "1.5px solid oklch(0.90 0.03 210)", fontFamily: "'Poppins', sans-serif" }}
                        />
                      ) : (
                        <div>
                          {so.manualOverride ? (
                            <div>
                              <p className="evo-label mb-2">Versión validada manualmente</p>
                              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.18 0.06 270)" }}>{so.manualOverride}</p>
                              <div className="mt-4 pt-4 border-t" style={{ borderColor: "oklch(0.93 0.02 210)" }}>
                                <p className="evo-label mb-2">Extracción original</p>
                                <p className="text-gray-400 text-sm leading-relaxed">{so.structuredText ?? so.rawText}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.18 0.06 270)" }}>{so.structuredText ?? so.rawText}</p>
                          )}

                          {/* Keywords */}
                          {((so.keywords as string[] | null) ?? []).length > 0 && (
                            <div className="mt-4">
                              <p className="evo-label mb-2">Palabras clave</p>
                              <div className="flex flex-wrap gap-1.5">
                                {(so.keywords as string[]).map((k, i) => (
                                  <span key={i} className="evo-badge evo-badge-gray">{k}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
