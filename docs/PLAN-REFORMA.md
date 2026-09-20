# Plan de Reforma y Desarrollo — Nodo360
*Basado en la auditoría del 20/09/2026*

**Workspace local:** `C:\Users\alber\nodo360-projects`
**Repo:** github.com/arrebolo/nodo360-plataforma

---

## Tier 0 — Parar la sangría

- [x] Arreglar el despliegue: producción corre desde `content/cold-storage-course`, no desde `main` — restaurar el flujo normal (deploy desde `main`) *(20/09/2026: PR #104 mergeada; producción sirve `main` @ `5ba986c` con `source: git`; rama `content/cold-storage-course` borrada)*
- [ ] Quitar o arreglar `/proyectos`: hoy promete DAO, NFTs y DEX con fechas de 2025 caducadas y progreso inventado (viola Principio #7)
- [ ] Decidir sobre Phase 27 (sistema de proyectos comunitarios):
  - [ ] Opción A: aplicar migración `019_projects_system.sql` + construir la UI
  - [ ] Opción B: revertir/ocultar los 12 endpoints hasta que haya usuarios premium reales
- [ ] Cerrar PR #49 (Fix/mentor panel styling) — obsoleto
- [ ] Cerrar PR #7 (Integrate/route groups auth sidebar) — no mergeable
- [ ] Cerrar PR #6 (Fix RSC CVE) — ya resuelto en `main`
- [ ] Revisar y cerrar PR #1 (Claude/claude md) — rescatar mejoras de `sitemap.ts` y metadata antes de cerrar
- [x] Commitear `docs/content/` (69 KB sin subir a git: guiones de Cold Storage, Nodos Bitcoin, guía de slides) *(20/09/2026: PR #103)*
- [ ] Configurar CI en PRs (typecheck + lint + build) — hoy no hay ninguna verificación automática antes de mergear

## Tier 1 — Ganancias rápidas de contenido

- [ ] Sustituir el contenido corto de **Cold Storage** (draft, ~1.000 chars/lección) por el guion completo de `docs/content/curso-cold-storage-completo.md` (26 KB)
- [ ] Sustituir el contenido corto de **Nodos Bitcoin** (draft, ~996 chars/lección) por el guion completo de `docs/content/curso-nodos-bitcoin-completo.md` (27 KB)
- [ ] Publicar la lección rica de dApps/smart contracts de `/output-lessons` (18 min) sustituyendo la versión breve actual
- [ ] Fusionar los 2 cursos de custodia duplicados en uno solo
- [ ] Fusionar los 2 cursos "Web3 básico" duplicados en uno solo

## Tier 2 — Reforma estructural del catálogo

- [ ] Decidir destino de la ruta **Trading** (2 cursos huérfanos del mapa Web3): archivar / mantener aparte / reconvertir
- [ ] Reencuadrar "Seguridad básica en Bitcoin y criptomonedas" como Seguridad Transversal nivel 1 (ampliar a riesgos Web3, no solo Bitcoin)
- [ ] Arreglar colisión de `position` entre rutas Seguridad Avanzada y Trading Básico
- [ ] Definir secuencia (`position`) dentro de las rutas legacy (hoy todas en 0)
- [ ] Documentar `is_admin` en una migración del repo (existe en la DB con parámetro `check_user_id`, pero no está en ninguna migración — una reconstrucción desde cero no la crearía)

## Tier 3 — Construcción nueva (por orden)

- [ ] **Fundamentos Blockchain** — curso base: consenso, PoW/PoS, forks, criptografía (0% cobertura actual)
- [ ] **Ethereum y Smart Contracts** — apoyarse en el artículo de blog existente + lección de dApps ya generada
- [ ] **DAOs** — sinergia con el sistema de gobernanza propio; resuelve la contradicción de `/proyectos`
- [ ] **NFTs** — usar como semilla la lección "Tokens y NFTs" de Ecosistema Web3 + artículo de blog
- [ ] **DeFi** — usar como semilla los 2 artículos de blog + 11 términos de glosario ya existentes
- [ ] **Otras L1/L2 e Interoperabilidad** — usar como semilla el artículo de blog sobre Layer 2

---

## Notas
- El blog (15 artículos) y el glosario (72 términos) ya cubren Ethereum, DeFi, NFTs, DAOs y Layer 2 — son la materia prima más barata para el Tier 3, no hay que partir de cero conceptualmente.
- Phase 27 no tiene sentido completarla hasta que `entitlements` tenga usuarios premium reales (hoy: 0).
