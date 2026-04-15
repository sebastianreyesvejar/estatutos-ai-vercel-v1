import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, ExternalLink, FileText, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <PageLayout title="Cargando..." backHref="/companies" backLabel="Empresas">
        <div className="flex items-center justify-center h-64">
          <p className="brutalista-label">Cargando empresa...</p>
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout title="No encontrado" backHref="/companies" backLabel="Empresas">
        <div className="flex items-center justify-center h-64">
          <p className="brutalista-label">Empresa no encontrada</p>
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
    >
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left: Documents */}
          <div className="p-8">
            <p className="brutalista-label mb-4">Documentos ({documents.length})</p>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin documentos registrados</p>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc.id} className="border border-border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <FileText size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground truncate">{doc.driveFileName ?? "Documento"}</span>
                      </div>
                      {doc.driveWebViewLink && (
                        <a href={doc.driveWebViewLink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className={`brutalista-tag status-${doc.status}`}>{doc.status}</span>
                    </div>
                    {doc.errorMessage && (
                      <p className="text-xs text-destructive mt-2 font-mono">{doc.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Social Objects */}
          <div className="lg:col-span-2 p-8">
            <p className="brutalista-label mb-4">Objetos Sociales Extraídos ({socialObjects.length})</p>
            {socialObjects.length === 0 ? (
              <div className="border border-border p-8 text-center">
                <p className="text-muted-foreground text-sm">No se han extraído objetos sociales aún.</p>
                <p className="brutalista-label mt-2">El documento debe ser procesado primero.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {socialObjects.map(so => (
                  <div key={so.id} className="border border-border">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted">
                      <div className="flex items-center gap-3">
                        {so.rubro && <span className="brutalista-tag">{so.rubro}</span>}
                        {so.extractionConfidence && (
                          <span className={`brutalista-tag status-${so.extractionConfidence === 'high' ? 'processed' : so.extractionConfidence === 'medium' ? 'processing' : 'error'}`}>
                            Confianza: {so.extractionConfidence}
                          </span>
                        )}
                        {so.isValidated && (
                          <span className="flex items-center gap-1 brutalista-tag status-processed">
                            <CheckCircle size={10} /> Validado
                          </span>
                        )}
                      </div>
                      {isAuthenticated && (
                        <div className="flex gap-2">
                          {editingId === so.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 font-mono text-xs"
                                onClick={() => {
                                  validateMutation.mutate({ id: so.id, manualOverride: editText, isValidated: true });
                                  setEditingId(null);
                                }}
                              >
                                <Save size={12} className="mr-1" /> Guardar
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingId(null)}>
                                <X size={12} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 font-mono text-xs"
                                onClick={() => { setEditingId(so.id); setEditText(so.manualOverride ?? so.structuredText ?? so.rawText); }}
                              >
                                <Edit3 size={12} className="mr-1" /> Editar
                              </Button>
                              {!so.isValidated && (
                                <Button
                                  size="sm"
                                  className="h-7 font-mono text-xs bg-foreground text-background hover:bg-muted-foreground"
                                  onClick={() => validateMutation.mutate({ id: so.id, isValidated: true })}
                                >
                                  <CheckCircle size={12} className="mr-1" /> Validar
                                </Button>
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
                          className="bg-input border-border font-mono text-sm min-h-48 resize-y"
                        />
                      ) : (
                        <div>
                          {so.manualOverride ? (
                            <div>
                              <p className="brutalista-label mb-2">Versión validada manualmente</p>
                              <p className="text-foreground text-sm leading-relaxed">{so.manualOverride}</p>
                              <div className="mt-4 pt-4 border-t border-border">
                                <p className="brutalista-label mb-2">Extracción original</p>
                                <p className="text-muted-foreground text-sm leading-relaxed">{so.structuredText ?? so.rawText}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-foreground text-sm leading-relaxed">{so.structuredText ?? so.rawText}</p>
                          )}
                        </div>
                      )}

                      {/* Keywords & Activities */}
                      {((so.keywords as string[] | null) ?? []).length > 0 && (
                        <div className="mt-4">
                          <p className="brutalista-label mb-2">Palabras clave</p>
                          <div className="flex flex-wrap gap-1">
                            {(so.keywords as string[]).map((k, i) => (
                              <span key={i} className="brutalista-tag">{k}</span>
                            ))}
                          </div>
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
