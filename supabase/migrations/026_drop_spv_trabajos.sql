-- ============================================================================
-- MIGRACION 026: retirada de las tablas de SPV Trabajos
--
-- *** YA APLICADA EN PRODUCCION ENTRE EL 20 Y EL 21 DE SEPTIEMBRE DE 2026 ***
--
-- Se versiona aqui a posteriori. No existia ningun archivo en el repo: todo el
-- cierre se ejecuto a mano en el SQL Editor durante el incidente.
--
-- QUE PASO
-- El proyecto Supabase de Nodo360 (gcahtbecfidroepelcuw) contenia dos tablas
-- que no pertenecen a esta plataforma, sino a SPV Trabajos, una aplicacion
-- distinta con su propio proyecto Supabase (zbyz...):
--
--   public.spv_trabajos       196 filas con datos reales de terceros
--   public.push_subscriptions   1 fila
--
-- Eran una copia huerfana anterior a la migracion de SPV Trabajos a su propio
-- proyecto, documentada en el 003_new_project_schema.sql de aquel repositorio.
-- Los datos se escribieron entre el 13 de abril y el 12 de agosto de 2026; el
-- repositorio de SPV Trabajos arranca el 18 de agosto de 2026.
--
-- Estaban sin RLS y sin REVOKE, es decir, legibles con la clave anonima de
-- Nodo360, que es publica por definicion (viaja en el navegador).
--
-- Ninguna de las dos es referenciada por el codigo de Nodo360: no hay un solo
-- .from('spv_trabajos') ni .from('push_subscriptions') en app/, lib/,
-- components/ ni scripts/.
-- ============================================================================


-- ============================================================================
-- PASO 1 - 20/09/2026: cerrar el acceso antes de tocar los datos
-- ============================================================================
--
--   ALTER TABLE public.spv_trabajos       ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
--
--   REVOKE ALL ON public.spv_trabajos       FROM anon, authenticated;
--   REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
--
-- Sin politicas, RLS deja ambas tablas cerradas. Verificado acto seguido: la
-- clave anonima pasaba de devolver filas a devolver 42501.


-- ============================================================================
-- PASO 2 - comprobar que no se perdia nada antes de borrar
-- ============================================================================
--
-- a) Comparacion contra el proyecto real de SPV Trabajos (zbyz...):
--    196/196 identificadores coincidentes, 196 updated_at identicos, 0 filas
--    que existieran solo en Nodo360, 0 ediciones pendientes de propagar.
--
-- b) Respaldo completo fuera de ambos repositorios, en
--    C:\\Users\\alber\\respaldo-tablas-spv-en-proyecto-nodo360-20260921.json
--    (192,2 KB, sha256 5a7be25d4741765f59c8939c8787c4d5...).
--
-- c) Recuento inmediatamente antes del borrado, para confirmar que las cifras
--    seguian siendo las esperadas:
--
--      SELECT 'spv_trabajos' AS tabla, count(*) FROM public.spv_trabajos
--      UNION ALL
--      SELECT 'push_subscriptions', count(*) FROM public.push_subscriptions;
--
--    Resultado: spv_trabajos 196, push_subscriptions 1. Coincide.


-- ============================================================================
-- PASO 3 - ensayo del borrado, deshecho con ROLLBACK
-- ============================================================================
--
-- Se ejecuto primero la misma transaccion terminada en ROLLBACK, para ver si
-- algo dependia de las tablas sin llegar a destruir nada. Si hubiera existido
-- una vista, una clave ajena o un trigger apuntando a ellas, el DROP sin
-- CASCADE habria fallado aqui y el ROLLBACK lo habria dejado todo intacto:
--
--   BEGIN;
--     DROP TABLE public.spv_trabajos;
--     DROP TABLE public.push_subscriptions;
--   ROLLBACK;
--
-- Termino sin errores: ningun objeto dependia de ellas.


-- ============================================================================
-- PASO 4 - 21/09/2026: el borrado real
-- ============================================================================
--
-- SQL ejecutado, literalmente:
--
--   BEGIN;
--     DROP TABLE public.spv_trabajos;
--     DROP TABLE public.push_subscriptions;
--   COMMIT;
--
-- Deliberadamente SIN CASCADE. CASCADE habria arrastrado en silencio cualquier
-- objeto dependiente; sin el, si algo hubiera dependido de estas tablas el DROP
-- habria fallado y la transaccion entera se habria deshecho, que es justo lo
-- que se queria en una base de datos de produccion con datos de terceros.
--
-- Las dos sentencias van en una sola transaccion para que no pueda quedar una
-- tabla borrada y la otra no.
--
-- ESTADO VERIFICADO EL 21/09/2026, despues del COMMIT:
--   anon         GET /rest/v1/spv_trabajos       -> 404 PGRST205 (no existe)
--   service_role GET /rest/v1/spv_trabajos       -> 404 PGRST205 (no existe)
--   anon         GET /rest/v1/push_subscriptions -> 404 PGRST205 (no existe)
--   service_role GET /rest/v1/push_subscriptions -> 404 PGRST205 (no existe)
-- ============================================================================


-- Reproduccion del PASO 4 para una reconstruccion desde cero. Se anade IF
-- EXISTS, que el original no llevaba, porque sobre una base de datos donde
-- estas tablas nunca se crearon el DROP a secas fallaria. Se mantiene sin
-- CASCADE, por el motivo explicado arriba.

BEGIN;
  DROP TABLE IF EXISTS public.spv_trabajos;
  DROP TABLE IF EXISTS public.push_subscriptions;
COMMIT;


-- ============================================================================
-- COMPROBACION (solo lectura, ejecutar aparte)
-- ============================================================================
-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name in ('spv_trabajos','push_subscriptions');
-- No debe devolver ninguna fila.


-- ============================================================================
-- PENDIENTE RELACIONADO
-- ============================================================================
-- Queda por decidir que se hace con el esquema backup_nodo360, que contiene una
-- copia de users con datos personales y no esta expuesto por PostgREST, por lo
-- que no se puede inspeccionar desde fuera del SQL Editor.
-- Anotado en docs/PLAN-REFORMA.md (Tier 2).
