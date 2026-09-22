-- ============================================================================
-- 036 APLICAR — el gPower solo para usuarios registrados
--
-- DECISIÓN
-- El poder de voto lo puede consultar cualquier usuario con sesión, incluido
-- el de otra persona: en una votación el peso de cada voto tiene que ser
-- verificable. Lo que se cierra es que un visitante anónimo enumere el gPower
-- de cualquiera por su id, que es lo que permitía la clave anon, pública por
-- diseño porque viaja en el paquete del navegador.
--
-- Comprobado el 22/09/2026: con la clave anon, calculate_gpower respondía 200
-- y devolvía 6.46 para un usuario real.
--
-- DESPLEGAR EL CÓDIGO ANTES QUE ESTA MIGRACIÓN
-- El cambio de la rama db/gpower-solo-registrados deja de llamar a la función
-- cuando no hay sesión. Si la migración entra primero, durante unos minutos la
-- página pública de una propuesta registraría un error en los logs por cada
-- visita anónima. No se rompe nada —la llamada ya iba dentro de un try/catch
-- que dejaba el gPower a cero— pero es ruido evitable.
--
-- SOBRE LA VISTA proposals_with_details
-- Es security_invoker e incluye author_gpower, calculado con esta función. En
-- Postgres el permiso EXECUTE se comprueba al preparar la consulta, así que no
-- vale con no pedir la columna ni con un CASE que no llegue a ejecutarse:
-- consultarla sin sesión fallaría entera.
--
-- Por eso la vista NO se toca y se resuelve en el código: la única ruta que la
-- usa, GET /api/governance/proposals, ahora mira si hay sesión y, cuando no la
-- hay, sirve la misma consulta con joins que ya usaban las páginas públicas
-- (getProposals), que nunca ha calculado el gPower. Esa ruta, además, no la
-- llama ninguna página del sitio: los únicos fetch a /api/governance/proposals
-- son el POST de crear propuesta y el de votar.
--
-- Fecha: 22/09/2026
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Privilegios
--
--    El REVOKE de PUBLIC es el que cierra de verdad: anon y authenticated
--    heredan de PUBLIC, así que revocar solo a anon no serviría de nada si
--    PUBLIC conserva el permiso.
-- ----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.calculate_gpower(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_gpower(UUID) FROM anon;

GRANT EXECUTE ON FUNCTION public.calculate_gpower(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_gpower(UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- 2. La guarda dentro de la función
--
--    El cuerpo se toma de pg_get_functiondef y solo se le inserta la guarda
--    tras el BEGIN: lo demás queda exactamente igual, tildes incluidas. Se
--    añade pg_temp al search_path, que solo declaraba 'public'.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_gpower(p_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_xp INTEGER;
    v_reputation INTEGER;
    v_badges_count INTEGER;
    v_gpower DECIMAL(10,2);
BEGIN

    -- GUARDA 036: el poder de voto solo lo ven usuarios registrados.
    -- Un usuario con sesion puede consultar el gPower de cualquiera: en una
    -- votacion el peso de cada voto tiene que ser verificable. Lo que se cierra
    -- es que un visitante anonimo enumere el gPower de cualquier persona por su
    -- id, que es lo que permitia la clave anon, publica por diseno.
    --
    -- Se exceptua service_role, cuyo auth.uid() tambien es nulo, para que un
    -- proceso del servidor pueda seguir calculandolo. Hoy no lo llama ninguno,
    -- pero romperlo en silencio si algun dia lo hace seria peor.
    IF auth.uid() IS NULL
       AND current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'El gPower solo esta disponible para usuarios registrados'
            USING ERRCODE = '42501';
    END IF;

    -- Obtener XP
    SELECT COALESCE(total_xp, 0) INTO v_xp
    FROM public.user_gamification_stats
    WHERE user_id = p_user_id;

    -- Obtener reputación
    SELECT COALESCE(reputation_points, 0) INTO v_reputation
    FROM public.user_reputation
    WHERE user_id = p_user_id;

    -- Contar badges/hitos
    SELECT COUNT(*) INTO v_badges_count
    FROM public.user_badges
    WHERE user_id = p_user_id;

    -- Calcular gPower: XP * 0.4 + Rep * 0.4 + Badges * 0.2
    -- Normalizado: XP/100, Rep/10, Badges*10
    v_gpower := (COALESCE(v_xp, 0)::DECIMAL / 100 * 0.4) +
                (COALESCE(v_reputation, 0)::DECIMAL / 10 * 0.4) +
                (COALESCE(v_badges_count, 0)::DECIMAL * 10 * 0.2);

    -- Mínimo de 1 para usuarios activos
    IF v_gpower < 1 AND (v_xp > 0 OR v_reputation > 0 OR v_badges_count > 0) THEN
        v_gpower := 1;
    END IF;

    RETURN ROUND(v_gpower, 2);
END;
$function$;

-- ----------------------------------------------------------------------------
-- 3. Red de seguridad
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_mal TEXT := '';
BEGIN
  IF has_function_privilege('anon', 'public.calculate_gpower(uuid)', 'EXECUTE') THEN
    v_mal := v_mal || 'anon sigue pudiendo ejecutar calculate_gpower. ';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.calculate_gpower(uuid)', 'EXECUTE') THEN
    v_mal := v_mal || 'authenticated no puede ejecutar calculate_gpower. ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'calculate_gpower'
       AND p.prosrc ~ 'auth\.uid\(\)'
  ) THEN
    v_mal := v_mal || 'la funcion no tiene la guarda de auth.uid(). ';
  END IF;

  IF v_mal <> '' THEN
    RAISE EXCEPTION 'Abortada: %', v_mal;
  END IF;
  RAISE NOTICE 'OK: calculate_gpower cerrada a anon, abierta a authenticated';
END $$;

COMMIT;
