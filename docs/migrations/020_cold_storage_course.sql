-- ============================================
-- MIGRATION 020: Cold Storage Course
-- Fecha: 20 Febrero 2026
-- Descripción: Curso "Cold Storage — Protege tus Bitcoin"
--   - Learning path: Seguridad Avanzada
--   - 2 módulos, 6 lecciones con contenido HTML
--   - 18 quiz questions (3 por lección)
-- ============================================

DO $$
DECLARE
  v_path_id UUID;
  v_course_id UUID;
  v_module1_id UUID;
  v_module2_id UUID;
BEGIN

  -- =====================================================
  -- 1. LEARNING PATH: Seguridad Avanzada
  -- =====================================================
  INSERT INTO public.learning_paths (
    slug, name, short_description, emoji, position, is_active
  ) VALUES (
    'seguridad-avanzada',
    'Seguridad Avanzada',
    'Aprende a proteger tus fondos con técnicas avanzadas de custodia y seguridad.',
    '🔐',
    4,
    true
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_path_id;

  -- Si ya existía, obtener el id
  IF v_path_id IS NULL THEN
    SELECT id INTO v_path_id FROM public.learning_paths WHERE slug = 'seguridad-avanzada';
  END IF;

  -- =====================================================
  -- 2. CURSO: Cold Storage — Protege tus Bitcoin
  -- =====================================================
  INSERT INTO public.courses (
    slug, title, description, long_description, level, status, price, is_free, is_premium,
    total_modules, total_lessons, total_duration_minutes
  ) VALUES (
    'cold-storage-protege-tus-bitcoin',
    'Cold Storage — Protege tus Bitcoin',
    'Aprende a proteger tus bitcoin fuera de internet. Desde entender tu modelo de amenazas hasta configurar un hardware wallet y hacer backups seguros.',
    'Tener bitcoin en un exchange o en una wallet conectada a internet es como guardar dinero en efectivo sobre la mesa. En este curso aprenderás a mover tus fondos a cold storage: almacenamiento sin conexión que te da control total. No necesitas ser técnico — solo necesitas criterio y un plan.',
    'intermediate',
    'draft',
    0,
    true,
    false,
    2,
    6,
    150
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_course_id;

  IF v_course_id IS NULL THEN
    SELECT id INTO v_course_id FROM public.courses WHERE slug = 'cold-storage-protege-tus-bitcoin';
  END IF;

  -- =====================================================
  -- 3. MÓDULOS
  -- =====================================================

  -- Módulo 1: Fundamentos de Custodia
  INSERT INTO public.modules (course_id, title, description, order_index, total_lessons, total_duration_minutes)
  VALUES (
    v_course_id,
    'Fundamentos de Custodia',
    'Entiende qué proteger, de quién, y qué opciones tienes antes de tocar ninguna herramienta.',
    1,
    3,
    75
  )
  RETURNING id INTO v_module1_id;

  -- Módulo 2: Implementación Práctica
  INSERT INTO public.modules (course_id, title, description, order_index, total_lessons, total_duration_minutes)
  VALUES (
    v_course_id,
    'Implementación Práctica',
    'Pasa de la teoría a la acción. Configura, respalda y verifica tu setup de cold storage.',
    2,
    3,
    75
  )
  RETURNING id INTO v_module2_id;

  -- =====================================================
  -- 4. LECCIONES
  -- =====================================================

  -- ----- MÓDULO 1 -----

  -- Lección 1.1: Hot vs Cold — Tu Modelo de Amenazas
  INSERT INTO public.lessons (module_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module1_id,
    'Hot vs Cold — Tu Modelo de Amenazas',
    'hot-vs-cold-tu-modelo-de-amenazas',
    'Entiende la diferencia entre hot y cold storage, y aprende a identificar tus propias amenazas.',
    1,
    '<p>Antes de elegir una wallet o un método de almacenamiento, necesitas hacerte una pregunta que muy pocos se hacen: <strong>¿de qué me estoy protegiendo exactamente?</strong></p>' ||
    '<p>Eso es lo que en seguridad se llama <strong>modelo de amenazas</strong>. No es lo mismo proteger 50€ en bitcoin que proteger los ahorros de tu vida. No es lo mismo vivir solo que tener familia. No es lo mismo un usuario que opera frecuentemente que uno que compra y guarda a largo plazo.</p>' ||
    '<p><strong>Hot storage</strong> es cualquier wallet conectada a internet: la app de tu exchange, una wallet en el móvil, una extensión del navegador. Es cómoda, rápida, y perfecta para cantidades pequeñas que usas a menudo. Pero está expuesta: si alguien compromete tu dispositivo, accede a tus fondos.</p>' ||
    '<p><strong>Cold storage</strong> es lo contrario: tus claves privadas nunca tocan internet. Pueden estar en un hardware wallet, en un dispositivo air-gapped, o incluso en un papel. Es menos cómoda, pero mucho más segura para cantidades significativas o ahorro a largo plazo.</p>' ||
    '<p>La clave no es elegir uno u otro. <strong>Es usar cada uno para lo que sirve.</strong></p>',
    true
  );

  -- Lección 1.2: Tipos de Cold Storage
  INSERT INTO public.lessons (module_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module1_id,
    'Tipos de Cold Storage',
    'tipos-de-cold-storage',
    'Conoce las opciones de cold storage que existen y compara sus ventajas y limitaciones.',
    2,
    '<p>No todo el cold storage es igual. Existen varias formas de mantener tus claves fuera de internet, y cada una tiene ventajas, limitaciones y casos de uso diferentes.</p>' ||
    '<p>La opción más conocida son los <strong>hardware wallets</strong>: dispositivos físicos diseñados específicamente para firmar transacciones sin exponer tus claves. Trezor, Ledger, ColdCard, BitBox, Keystone — hay muchas opciones. Lo que tienen en común es que tus claves se generan y viven dentro del dispositivo. Cuando quieres enviar bitcoin, el dispositivo firma la transacción internamente y solo envía la transacción firmada al exterior. Las claves nunca salen.</p>' ||
    '<p>Otra opción son los <strong>dispositivos air-gapped</strong>: ordenadores o móviles que nunca se conectan a internet. Puedes usar un móvil viejo con una wallet instalada, sin SIM y sin wifi. Es más barato que un hardware wallet, pero requiere más disciplina.</p>' ||
    '<p>Las <strong>paper wallets</strong> fueron populares hace años: imprimes tu clave privada en papel y la guardas. El problema es que son frágiles, fáciles de dañar, y es muy fácil cometer errores al usarlas. Hoy en día no se recomiendan excepto en casos muy específicos.</p>' ||
    '<p>Finalmente, los <strong>steel backups</strong> (placas de metal) no son wallets en sí, sino un método para guardar tu seed phrase de forma resistente al fuego, agua y tiempo. Son complementarios a cualquier otra solución de cold storage.</p>' ||
    '<p>No hay una opción perfecta universal. Lo que importa es que entiendas qué te ofrece cada una y <strong>elijas con criterio</strong>.</p>',
    false
  );

  -- Lección 1.3: Seed Phrases — Tu Llave Maestra
  INSERT INTO public.lessons (module_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module1_id,
    'Seed Phrases — Tu Llave Maestra',
    'seed-phrases-tu-llave-maestra',
    'Entiende qué es una seed phrase, por qué es crítica, y los errores más comunes que debes evitar.',
    3,
    '<p>Si tuvieras que recordar una sola cosa de este curso, que sea esto: <strong>tu seed phrase ES tu bitcoin</strong>. Quien la tenga, tiene tus fondos. Quien la pierda, pierde el acceso para siempre.</p>' ||
    '<p>Una <strong>seed phrase</strong> (también llamada frase de recuperación o mnemonic) es una secuencia de 12 o 24 palabras en un orden específico. Esas palabras codifican la clave maestra desde la que se generan todas tus direcciones y claves privadas. El estándar se llama BIP39, pero no necesitas saber los detalles técnicos — lo que necesitas saber es que esas palabras lo son todo.</p>' ||
    '<p>Cuando configuras un hardware wallet o una wallet de software, el dispositivo genera tu seed phrase. Tu único trabajo es anotarla correctamente y guardarla en un lugar seguro. Parece simple, pero es donde la mayoría de la gente comete errores.</p>' ||
    '<p><strong>Errores comunes:</strong> hacer una foto de la seed (ahora está en tu galería, en la nube, expuesta). Guardarla en un archivo de texto en el ordenador. Enviarla por WhatsApp "a ti mismo". Anotarla en un post-it. Guardar una copia y ningún backup. No verificar que la anotaste correctamente.</p>' ||
    '<p><strong>Reglas fundamentales:</strong> anótala en papel o metal, nunca en digital. Guárdala en un lugar seguro y separado del dispositivo. Haz al menos un backup en otra ubicación física. Nunca la compartas con nadie. Verifica que funciona antes de enviar fondos.</p>' ||
    '<p>Tu seed phrase es lo más valioso que tienes en el mundo Bitcoin. <strong>Trátala como tal.</strong></p>',
    false
  );

  -- ----- MÓDULO 2 -----

  -- Lección 2.1: Configurar un Hardware Wallet
  INSERT INTO public.lessons (module_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module2_id,
    'Configurar un Hardware Wallet',
    'configurar-un-hardware-wallet',
    'Aprende a elegir y configurar un hardware wallet paso a paso, con criterio.',
    1,
    '<p>Ahora que entiendes los fundamentos, es momento de pasar a la práctica. En esta lección vamos a recorrer el proceso de configuración de un hardware wallet, paso a paso, independientemente de la marca que elijas.</p>' ||
    '<p><strong>Antes de comprar:</strong> compra siempre directamente del fabricante o de un distribuidor oficial. Nunca de segunda mano, nunca de un vendedor no verificado en Amazon o similares. Un dispositivo manipulado puede parecer nuevo pero tener firmware modificado que roba tus claves. Esto no es paranoia — ha pasado.</p>' ||
    '<p>Al recibirlo, verifica que el embalaje está intacto y que el dispositivo no muestra signos de manipulación. Algunos fabricantes incluyen sellos holográficos o verificación de autenticidad por software.</p>' ||
    '<p>El proceso de configuración es similar en todos los hardware wallets: conectas el dispositivo, instalas el <strong>software companion</strong> (Trezor Suite, Ledger Live, Sparrow, etc.), el dispositivo genera tu seed phrase, la anotas en papel/metal, la verificas, y estableces un PIN de acceso.</p>' ||
    '<p>Un punto que mucha gente pasa por alto: el software companion no es obligatorio para operar. Puedes usar tu hardware wallet con <strong>software independiente</strong> como Sparrow Wallet o Electrum. Esto reduce la dependencia de un solo fabricante y te da más control.</p>' ||
    '<p>Después de configurar, haz una <strong>transacción de prueba</strong>: envía una cantidad mínima, verifica que llega, verifica que puedes enviar desde el dispositivo. Solo entonces empieza a mover cantidades importantes.</p>',
    false
  );

  -- Lección 2.2: Backup Seguro de Seeds
  INSERT INTO public.lessons (module_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module2_id,
    'Backup Seguro de Seeds',
    'backup-seguro-de-seeds',
    'Aprende a hacer backups seguros de tu seed phrase y diseña una estrategia de respaldo.',
    2,
    '<p>Ya tienes tu hardware wallet configurado y tu seed anotada. Ahora viene la parte que separa a los usuarios preparados de los que perderán fondos: <strong>el backup</strong>.</p>' ||
    '<p>Una sola copia de tu seed en un solo lugar es un <strong>punto único de fallo</strong>. Un incendio, una inundación, un robo, o simplemente olvidar dónde la guardaste, y pierdes todo. Necesitas redundancia.</p>' ||
    '<p>La regla básica es <strong>2-3 copias en ubicaciones físicas diferentes</strong>. No todas en tu casa. Piensa en casa de un familiar de confianza, una caja de seguridad en un banco, o una ubicación geográficamente separada.</p>' ||
    '<p><strong>El material importa.</strong> Papel funciona, pero es vulnerable al agua, fuego y deterioro con el tiempo. Las placas de metal (steel backups) resisten fuego hasta 1500°C, agua, y corrosión. Para cantidades significativas, el coste de una placa de metal (30-80€) es insignificante comparado con lo que protege.</p>' ||
    '<p><strong>Métodos de grabado en metal:</strong> hay placas donde estampas letras con un punzón, otras donde atornillas letras, y algunas donde grabas directamente. Todas funcionan. Lo importante es que sea legible, resistente, y que verifiques que anotaste correctamente.</p>' ||
    '<p><strong>Distribución geográfica:</strong> no guardes todas las copias cerca. Si tu zona sufre un desastre natural, quieres al menos una copia en otro lugar. Pero tampoco las disperses tanto que pierdas control sobre ellas.</p>' ||
    '<p>Un punto que se olvida: <strong>documenta dónde están tus backups</strong>. De nada sirve tener 3 copias si dentro de 5 años no recuerdas dónde las pusiste. Mantén un registro (sin incluir la seed misma) de las ubicaciones.</p>',
    false
  );

  -- Lección 2.3: Verificación y Simulacro de Recuperación
  INSERT INTO public.lessons (module_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module2_id,
    'Verificación y Simulacro de Recuperación',
    'verificacion-y-simulacro-de-recuperacion',
    'Aprende a verificar que tu setup funciona y haz un simulacro de recuperación completo.',
    3,
    '<p>Esta es probablemente la lección más importante del curso, y la que menos gente hace. De nada sirve tener un hardware wallet configurado y 3 copias de tu seed si <strong>nunca has verificado que puedes recuperar tus fondos en caso de emergencia</strong>.</p>' ||
    '<p>Un <strong>simulacro de recuperación</strong> es exactamente lo que suena: simulas que has perdido tu dispositivo y verificas que puedes recuperar el acceso usando solo tu seed phrase.</p>' ||
    '<p>El proceso es simple: resetea tu hardware wallet (o usa uno nuevo), selecciona "restaurar wallet existente", introduce tu seed phrase palabra por palabra, y verifica que las mismas direcciones y el mismo saldo aparecen. Si aparecen, tu backup funciona. Si no, tienes un problema que es mejor descubrir ahora y no cuando realmente lo necesites.</p>' ||
    '<p><strong>Cuándo hacer un simulacro:</strong> después de la configuración inicial (obligatorio), cada 6-12 meses como rutina, y cada vez que cambies la ubicación de un backup.</p>' ||
    '<p>Además del simulacro, mantén una <strong>checklist de seguridad personal</strong>. Una lista de preguntas que revisas periódicamente: ¿Sé dónde están mis backups? ¿Mis backups son legibles? ¿Alguien de confianza sabe que tengo bitcoin y cómo acceder si me pasa algo? ¿Mi PIN es seguro? ¿Mi firmware está actualizado?</p>' ||
    '<p><strong>No te fíes de la memoria. No te fíes de la suerte. Verifica.</strong></p>',
    false
  );

  -- =====================================================
  -- 5. QUIZ QUESTIONS (18 preguntas — 3 por lección)
  -- =====================================================

  -- ----- MÓDULO 1: Preguntas 1-9 -----

  -- Lección 1.1 — Pregunta 1
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Qué es un modelo de amenazas?',
    '["Un software que detecta virus", "Una evaluación de qué riesgos te afectan y cómo protegerte", "Una lista de hackers conocidos", "Un tipo de wallet"]'::jsonb,
    1,
    'Un modelo de amenazas es una evaluación personal de los riesgos que te afectan y las medidas que necesitas para protegerte.',
    1,
    'easy',
    1
  );

  -- Lección 1.1 — Pregunta 2
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Cuál es la principal diferencia entre hot y cold storage?',
    '["El precio", "El tamaño del dispositivo", "Si las claves privadas están conectadas a internet o no", "La cantidad de bitcoin que pueden guardar"]'::jsonb,
    2,
    'La diferencia fundamental es si tus claves privadas están expuestas a internet (hot) o completamente desconectadas (cold).',
    2,
    'easy',
    1
  );

  -- Lección 1.1 — Pregunta 3
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Para qué tipo de uso es más adecuado el cold storage?',
    '["Compras diarias de café", "Trading frecuente", "Ahorro a largo plazo y cantidades significativas", "Recibir pagos en una tienda"]'::jsonb,
    2,
    'El cold storage es ideal para ahorro a largo plazo y cantidades significativas, donde la seguridad es más importante que la comodidad.',
    3,
    'easy',
    1
  );

  -- Lección 1.2 — Pregunta 4
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Cómo protege un hardware wallet tus claves privadas?',
    '["Las envía cifradas a la nube", "Las genera y mantiene dentro del dispositivo, sin exponerlas a internet", "Las divide en varios archivos", "Las protege con antivirus"]'::jsonb,
    1,
    'Un hardware wallet genera y almacena las claves dentro del dispositivo. Las transacciones se firman internamente y las claves nunca salen del dispositivo.',
    4,
    'medium',
    1
  );

  -- Lección 1.2 — Pregunta 5
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Por qué las paper wallets ya no se recomiendan como método principal?',
    '["Porque son ilegales", "Porque son frágiles, propensas a errores y fáciles de dañar", "Porque no funcionan con Bitcoin", "Porque son demasiado caras"]'::jsonb,
    1,
    'Las paper wallets son frágiles, se dañan fácilmente con agua o fuego, y es muy fácil cometer errores al usarlas.',
    5,
    'medium',
    1
  );

  -- Lección 1.2 — Pregunta 6
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Qué es un steel backup?',
    '["Una wallet hecha de acero", "Un método para guardar tu seed phrase en metal resistente al fuego y agua", "Un exchange especialmente seguro", "Un tipo de hardware wallet"]'::jsonb,
    1,
    'Un steel backup es una placa de metal donde grabas tu seed phrase. Resiste fuego, agua y corrosión, protegiendo tu backup a largo plazo.',
    6,
    'easy',
    1
  );

  -- Lección 1.3 — Pregunta 7
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Qué representa tu seed phrase?',
    '["Tu contraseña del exchange", "La clave maestra desde la que se generan todas tus claves y direcciones", "Tu nombre de usuario en la blockchain", "Un código de verificación temporal"]'::jsonb,
    1,
    'La seed phrase codifica la clave maestra (BIP39) desde la que se derivan todas tus claves privadas y direcciones Bitcoin.',
    7,
    'medium',
    1
  );

  -- Lección 1.3 — Pregunta 8
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Cuál de estas acciones es SEGURA para guardar tu seed phrase?',
    '["Hacer una foto con el móvil", "Guardarla en un archivo en Google Drive", "Anotarla en papel y guardarla en un lugar seguro y separado del dispositivo", "Enviarla por email a ti mismo"]'::jsonb,
    2,
    'La seed phrase debe anotarse en papel o metal y guardarse en un lugar seguro, separado del dispositivo. Nunca en formato digital.',
    8,
    'medium',
    1
  );

  -- Lección 1.3 — Pregunta 9
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Qué pasa si pierdes tu seed phrase y tu dispositivo deja de funcionar?',
    '["Contactas al fabricante y te la recuperan", "Pierdes el acceso a tus fondos de forma permanente", "Bitcoin te genera una nueva automáticamente", "Puedes recuperarla desde la blockchain"]'::jsonb,
    1,
    'Sin tu seed phrase y sin acceso al dispositivo, tus fondos se pierden para siempre. No hay soporte técnico ni forma de recuperación.',
    9,
    'medium',
    1
  );

  -- ----- MÓDULO 2: Preguntas 1-9 -----

  -- Lección 2.1 — Pregunta 1
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Dónde debes comprar un hardware wallet?',
    '["En cualquier tienda online con buen precio", "De segunda mano para ahorrar", "Directamente del fabricante o distribuidor oficial", "En grupos de Telegram"]'::jsonb,
    2,
    'Siempre compra directamente del fabricante o de un distribuidor oficial para evitar dispositivos manipulados.',
    1,
    'easy',
    1
  );

  -- Lección 2.1 — Pregunta 2
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Por qué es importante hacer una transacción de prueba después de configurar?',
    '["Para ganar puntos en la wallet", "Para verificar que todo funciona antes de mover cantidades importantes", "Porque el dispositivo lo exige", "Para activar el dispositivo"]'::jsonb,
    1,
    'Una transacción de prueba te permite verificar que todo funciona correctamente antes de confiar cantidades importantes al dispositivo.',
    2,
    'easy',
    1
  );

  -- Lección 2.1 — Pregunta 3
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Es obligatorio usar el software companion del fabricante (ej: Ledger Live)?',
    '["Sí, sin él no funciona", "No, puedes usar software independiente como Sparrow Wallet", "Solo si tienes un modelo antiguo", "Solo para Bitcoin, no para otras criptomonedas"]'::jsonb,
    1,
    'No es obligatorio. Puedes usar software independiente como Sparrow Wallet o Electrum, lo que reduce la dependencia de un solo fabricante.',
    3,
    'medium',
    1
  );

  -- Lección 2.2 — Pregunta 4
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Cuántas copias de tu seed phrase deberías tener como mínimo?',
    '["1, bien guardada", "2-3, en ubicaciones físicas diferentes", "10, para estar seguro", "Ninguna, la memorizo"]'::jsonb,
    1,
    'La regla básica es tener 2-3 copias en ubicaciones físicas diferentes para evitar un punto único de fallo.',
    4,
    'easy',
    1
  );

  -- Lección 2.2 — Pregunta 5
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Cuál es la ventaja principal de un steel backup frente al papel?',
    '["Es más barato", "Es más fácil de leer", "Resiste fuego, agua y corrosión", "Ocupa menos espacio"]'::jsonb,
    2,
    'Las placas de metal resisten fuego hasta 1500°C, agua y corrosión, ofreciendo una protección muy superior al papel.',
    5,
    'easy',
    1
  );

  -- Lección 2.2 — Pregunta 6
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Qué debes documentar sobre tus backups?',
    '["La seed phrase completa en un archivo digital", "Las ubicaciones donde están guardados, sin incluir la seed", "Las contraseñas de tus exchanges", "No debes documentar nada"]'::jsonb,
    1,
    'Documenta dónde están guardados tus backups, pero nunca incluyas la seed phrase en ese registro.',
    6,
    'medium',
    1
  );

  -- Lección 2.3 — Pregunta 7
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Qué es un simulacro de recuperación?',
    '["Instalar un antivirus en el hardware wallet", "Verificar que puedes restaurar tus fondos usando solo tu seed phrase", "Hacer una copia de seguridad del PIN", "Contactar al fabricante para verificar tu identidad"]'::jsonb,
    1,
    'Un simulacro de recuperación consiste en resetear tu dispositivo y restaurarlo con tu seed phrase para verificar que funciona.',
    7,
    'medium',
    1
  );

  -- Lección 2.3 — Pregunta 8
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Con qué frecuencia deberías hacer un simulacro de recuperación?',
    '["Solo una vez al configurar", "Cada semana", "Después de configurar y luego cada 6-12 meses", "Solo si pierdes el dispositivo"]'::jsonb,
    2,
    'Se recomienda hacer un simulacro después de la configuración inicial y luego cada 6-12 meses como rutina.',
    8,
    'medium',
    1
  );

  -- Lección 2.3 — Pregunta 9
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Qué debes verificar durante un simulacro?',
    '["Que el dispositivo enciende", "Que las mismas direcciones y saldo aparecen tras restaurar con la seed", "Que la batería está cargada", "Que la app del fabricante se actualiza"]'::jsonb,
    1,
    'Durante un simulacro debes verificar que al restaurar con tu seed phrase aparecen las mismas direcciones y el mismo saldo.',
    9,
    'medium',
    1
  );

  -- =====================================================
  -- 6. VINCULAR CURSO A RUTA DE APRENDIZAJE
  -- =====================================================
  INSERT INTO public.learning_path_courses (learning_path_id, course_id, position, is_required)
  VALUES (v_path_id, v_course_id, 1, true)
  ON CONFLICT (learning_path_id, course_id) DO NOTHING;

END $$;
