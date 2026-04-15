# Estatutos AI — TODO

## Base de Datos
- [x] Tabla `companies` con campos: id, name, driveFolderId, rubro, status, timestamps
- [x] Tabla `documents` con campos: id, companyId, driveFileId, s3Key, status, errorMessage, timestamps
- [x] Tabla `social_objects` con campos: id, companyId, documentId, rawText, structuredText, rubro, keywords, activities, confidence, isValidated, manualOverride, validatedBy
- [x] Tabla `draft_statutes` con campos: id, userId, companyName, rubro, description, generatedSocialObject, generatedFullStatute, title, prompt, timestamps
- [x] Tabla `sync_jobs` con campos: id, userId, status, totalFiles, newFiles, errorFiles, errorMessage, timestamps
- [x] Migración de base de datos ejecutada correctamente

## Backend
- [x] Módulo de integración con Google Drive API (service account)
- [x] Módulo de extracción de texto de PDFs (pdf-parse)
- [x] Motor de extracción de objetos sociales con IA (invokeLLM + JSON schema)
- [x] Generador de objetos sociales con contexto de base de conocimiento
- [x] Generador de estatutos completos con IA
- [x] Helpers de base de datos: getCompanies, getCompanyById, searchSocialObjects, etc.
- [x] Router tRPC: knowledge (stats, search, rubros)
- [x] Router tRPC: companies (list, byId)
- [x] Router tRPC: documents (stats, pending, processOne)
- [x] Router tRPC: socialObjects (validate, byDocument)
- [x] Router tRPC: sync (status, start)
- [x] Router tRPC: admin (stats, recentJobs, syncDrive, processNext, processAll)
- [x] Router tRPC: drafts (list, byId, generateSocialObject, generateFullStatute, update, delete)
- [x] Credenciales Google Drive configuradas como secrets
- [x] Tests unitarios: 15 tests pasando

## Frontend
- [x] Diseño brutalista monocromático con Space Grotesk + Space Mono
- [x] Paleta oscura estricta en escala de grises (oklch)
- [x] Componente PageLayout reutilizable con navegación
- [x] Página Home con hero, stats y features
- [x] Página KnowledgeBase con búsqueda y filtros por rubro
- [x] Página Companies con tabla y filtros por estado
- [x] Página CompanyDetail con documentos y objetos sociales extraídos
- [x] Edición y validación manual de objetos sociales
- [x] Página Drafts con listado de borradores
- [x] Página DraftDetail con editor de objeto social y estatuto completo
- [x] Página Admin con panel de control y sincronización
- [x] Acciones de admin: sincronizar Drive, procesar siguiente, procesar lote

## Seguridad
- [x] Restringir vista Admin solo al usuario owner (role=admin en DB y verificación en frontend/backend)
