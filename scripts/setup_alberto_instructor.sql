-- ============================================================================
-- SCRIPT: Configurar requisitos de instructor para alberto1 (arrebolo@gmail.com)
-- ============================================================================
-- Este script:
-- 1. Obtiene el user_id del usuario
-- 2. Crea suscripción premium activa
-- 3. Inscribe y completa todos los cursos de una ruta
-- 4. Marca quiz final aprobado para cada curso
-- 5. Crea examen de instructor de prueba si no existe
-- 6. Verifica que cumple requisitos
-- ============================================================================

-- Usar transacción para poder hacer rollback si algo falla
BEGIN;

-- ============================================================================
-- PASO 0: Declarar variables
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'arrebolo@gmail.com';
  v_path_id UUID;
  v_path_slug TEXT;
  v_course RECORD;
  v_module RECORD;
  v_lesson RECORD;
  v_exam_id UUID;
  v_model_id UUID;
  v_question_num INTEGER;
BEGIN
  -- ==========================================================================
  -- PASO 1: Obtener user_id
  -- ==========================================================================
  SELECT id INTO v_user_id FROM users WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', v_user_email;
  END IF;

  RAISE NOTICE '✅ Usuario encontrado: % (ID: %)', v_user_email, v_user_id;

  -- ==========================================================================
  -- PASO 2: Crear suscripción Premium activa
  -- ==========================================================================
  -- Primero eliminar suscripciones anteriores para evitar conflictos
  DELETE FROM subscriptions WHERE user_id = v_user_id;

  INSERT INTO subscriptions (
    user_id,
    plan_type,
    price_cents,
    status,
    starts_at,
    ends_at,
    auto_renew
  ) VALUES (
    v_user_id,
    'annual',
    0, -- Gratis para testing
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    false
  );

  RAISE NOTICE '✅ Suscripción premium creada (válida hasta: %)', NOW() + INTERVAL '1 year';

  -- ==========================================================================
  -- PASO 3: Obtener la primera ruta de aprendizaje activa
  -- ==========================================================================
  SELECT id, slug INTO v_path_id, v_path_slug
  FROM learning_paths
  WHERE is_active = true
  ORDER BY created_at
  LIMIT 1;

  IF v_path_id IS NULL THEN
    RAISE EXCEPTION 'No hay rutas de aprendizaje activas';
  END IF;

  RAISE NOTICE '✅ Ruta seleccionada: % (ID: %)', v_path_slug, v_path_id;

  -- ==========================================================================
  -- PASO 4: Inscribir y completar todos los cursos de la ruta
  -- ==========================================================================
  FOR v_course IN
    SELECT c.id, c.slug, c.title, c.has_final_quiz
    FROM path_courses pc
    JOIN courses c ON c.id = pc.course_id
    WHERE pc.path_id = v_path_id
    ORDER BY pc.order_index
  LOOP
    -- Inscribir en el curso (si no está inscrito)
    INSERT INTO course_enrollments (user_id, course_id, enrolled_at, completed_at)
    VALUES (v_user_id, v_course.id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day')
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      completed_at = NOW() - INTERVAL '1 day';

    RAISE NOTICE '  📚 Curso inscrito y completado: %', v_course.title;

    -- Completar todas las lecciones del curso
    FOR v_module IN
      SELECT id FROM modules WHERE course_id = v_course.id
    LOOP
      FOR v_lesson IN
        SELECT id FROM lessons WHERE module_id = v_module.id
      LOOP
        INSERT INTO user_progress (user_id, lesson_id, is_completed, completed_at)
        VALUES (v_user_id, v_lesson.id, true, NOW() - INTERVAL '2 days')
        ON CONFLICT (user_id, lesson_id) DO UPDATE SET
          is_completed = true,
          completed_at = NOW() - INTERVAL '2 days';
      END LOOP;
    END LOOP;

    -- ==========================================================================
    -- PASO 5: Marcar quiz final como aprobado
    -- ==========================================================================
    -- Primero marcar que el curso tiene quiz final
    UPDATE courses SET has_final_quiz = true WHERE id = v_course.id;

    -- Insertar intento aprobado del quiz final
    INSERT INTO course_final_quiz_attempts (
      user_id,
      course_id,
      score,
      total_questions,
      correct_answers,
      passed,
      answers,
      time_spent_seconds,
      completed_at
    ) VALUES (
      v_user_id,
      v_course.id,
      90, -- 90% score
      10,
      9,
      true,
      '[]'::jsonb,
      300,
      NOW() - INTERVAL '1 day'
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '    ✓ Quiz final aprobado (90%%)';
  END LOOP;

  -- ==========================================================================
  -- PASO 6: Verificar/Crear examen de instructor para la ruta
  -- ==========================================================================
  SELECT id INTO v_exam_id
  FROM instructor_exams
  WHERE learning_path_id = v_path_id AND is_active = true
  LIMIT 1;

  IF v_exam_id IS NULL THEN
    -- Crear examen
    INSERT INTO instructor_exams (
      learning_path_id,
      title,
      description,
      slug,
      total_questions,
      pass_threshold,
      time_limit_minutes,
      total_models,
      cooldown_days,
      exhausted_cooldown_months,
      certification_validity_years,
      is_active
    ) VALUES (
      v_path_id,
      'Examen de Instructor - ' || v_path_slug,
      'Examen de certificación para instructores. 20 preguntas, 80% para aprobar.',
      'instructor-exam-' || v_path_slug,
      20,
      80,
      30,
      10,
      15,
      6,
      2,
      true
    )
    RETURNING id INTO v_exam_id;

    RAISE NOTICE '✅ Examen de instructor creado (ID: %)', v_exam_id;

    -- Crear modelo de examen
    INSERT INTO instructor_exam_models (exam_id, model_number, title, is_active)
    VALUES (v_exam_id, 1, 'Modelo A', true)
    RETURNING id INTO v_model_id;

    RAISE NOTICE '  📋 Modelo de examen creado (ID: %)', v_model_id;

    -- Crear 20 preguntas de ejemplo
    FOR v_question_num IN 1..20 LOOP
      INSERT INTO instructor_exam_questions (
        model_id,
        question,
        explanation,
        options,
        correct_answer,
        order_index,
        difficulty,
        category
      ) VALUES (
        v_model_id,
        'Pregunta de prueba #' || v_question_num || ': ¿Cuál es la respuesta correcta?',
        'Explicación de la respuesta correcta para la pregunta ' || v_question_num,
        '["Opción A (correcta)", "Opción B", "Opción C", "Opción D"]'::jsonb,
        0, -- La primera opción es la correcta
        v_question_num,
        'hard',
        'general'
      );
    END LOOP;

    RAISE NOTICE '  ✓ 20 preguntas de prueba creadas';
  ELSE
    RAISE NOTICE '✅ Examen de instructor ya existe (ID: %)', v_exam_id;

    -- Verificar que tiene al menos un modelo
    SELECT id INTO v_model_id FROM instructor_exam_models
    WHERE exam_id = v_exam_id AND is_active = true LIMIT 1;

    IF v_model_id IS NULL THEN
      INSERT INTO instructor_exam_models (exam_id, model_number, title, is_active)
      VALUES (v_exam_id, 1, 'Modelo A', true)
      RETURNING id INTO v_model_id;

      -- Crear 20 preguntas
      FOR v_question_num IN 1..20 LOOP
        INSERT INTO instructor_exam_questions (
          model_id,
          question,
          explanation,
          options,
          correct_answer,
          order_index,
          difficulty,
          category
        ) VALUES (
          v_model_id,
          'Pregunta de prueba #' || v_question_num || ': ¿Cuál es la respuesta correcta?',
          'Explicación de la respuesta correcta para la pregunta ' || v_question_num,
          '["Opción A (correcta)", "Opción B", "Opción C", "Opción D"]'::jsonb,
          0,
          v_question_num,
          'hard',
          'general'
        );
      END LOOP;

      RAISE NOTICE '  📋 Modelo y preguntas creados';
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'CONFIGURACIÓN COMPLETADA PARA: %', v_user_email;
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Ruta: %', v_path_slug;
  RAISE NOTICE 'Exam ID: %', v_exam_id;
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================================
-- PASO 7: Verificar elegibilidad (fuera del bloque DO para ver resultados)
-- ============================================================================

-- Mostrar estado del usuario
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role
FROM users u
WHERE u.email = 'arrebolo@gmail.com';

-- Mostrar suscripción
SELECT
  s.id,
  s.plan_type,
  s.status,
  s.starts_at,
  s.ends_at
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'arrebolo@gmail.com';

-- Verificar función has_premium_access
SELECT
  has_premium_access(u.id) as tiene_premium
FROM users u
WHERE u.email = 'arrebolo@gmail.com';

-- Mostrar cursos completados
SELECT
  c.title,
  ce.enrolled_at,
  ce.completed_at
FROM course_enrollments ce
JOIN courses c ON ce.course_id = c.id
JOIN users u ON ce.user_id = u.id
WHERE u.email = 'arrebolo@gmail.com'
ORDER BY ce.enrolled_at;

-- Mostrar quizzes aprobados
SELECT
  c.title as curso,
  cfqa.score,
  cfqa.passed,
  cfqa.completed_at
FROM course_final_quiz_attempts cfqa
JOIN courses c ON cfqa.course_id = c.id
JOIN users u ON cfqa.user_id = u.id
WHERE u.email = 'arrebolo@gmail.com';

-- ============================================================================
-- VERIFICAR ELEGIBILIDAD PARA EXAMEN
-- ============================================================================
SELECT
  ged.*
FROM users u
CROSS JOIN LATERAL (
  SELECT * FROM get_exam_eligibility_details(
    u.id,
    (SELECT id FROM instructor_exams WHERE is_active = true LIMIT 1)
  )
) ged
WHERE u.email = 'arrebolo@gmail.com';

COMMIT;

-- ============================================================================
-- RESUMEN DE LO QUE SE CREÓ:
-- ============================================================================
-- 1. Suscripción premium activa por 1 año
-- 2. Inscripciones completadas en todos los cursos de la primera ruta
-- 3. Progreso 100% en todas las lecciones
-- 4. Quiz final aprobado (90%) en cada curso
-- 5. Examen de instructor con 20 preguntas (si no existía)
--
-- El usuario ahora debería poder intentar el examen de instructor.
-- ============================================================================
