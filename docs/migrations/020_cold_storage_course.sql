-- ============================================
-- MIGRATION 020: Cold Storage Course
-- Fecha: 20 Febrero 2026
-- Descripcion: Curso "Cold Storage — Protege tus Bitcoin"
--   - Learning path: Seguridad Avanzada
--   - 2 modulos, 6 lecciones con contenido HTML
--   - 18 quiz questions (3 por leccion)
-- ============================================
-- SOLO inserta datos. No crea funciones, triggers ni politicas RLS.
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
  -- Columnas validas: id, slug, name, emoji, short_description,
  --   long_description, is_active, position, subtitle,
  --   created_at, updated_at
  -- =====================================================
  INSERT INTO public.learning_paths (
    slug, name, emoji, short_description, position, is_active
  ) VALUES (
    'seguridad-avanzada',
    'Seguridad Avanzada',
    '🔐',
    'Aprende a proteger tus fondos con tecnicas avanzadas de custodia y seguridad.',
    4,
    true
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_path_id;

  IF v_path_id IS NULL THEN
    SELECT id INTO v_path_id FROM public.learning_paths WHERE slug = 'seguridad-avanzada';
  END IF;

  -- =====================================================
  -- 2. CURSO: Cold Storage — Protege tus Bitcoin
  -- Columnas validas: id, slug, title, description, long_description,
  --   thumbnail_url, banner_url, level, status, price, is_free,
  --   instructor_id, total_modules, total_lessons,
  --   total_duration_minutes, enrolled_count, meta_title,
  --   meta_description, created_at, updated_at, published_at,
  --   is_premium, duration_label, is_certifiable, subtitle,
  --   difficulty_level, topic_category, learning_objectives,
  --   requirements, target_audience, owner_id, owner_role,
  --   review_status, has_final_quiz, rejection_reason
  -- =====================================================
  INSERT INTO public.courses (
    slug, title, description, long_description,
    level, status, price, is_free, is_premium,
    total_modules, total_lessons, total_duration_minutes
  ) VALUES (
    'cold-storage-protege-tus-bitcoin',
    'Cold Storage — Protege tus Bitcoin',
    'Aprende a proteger tus bitcoin fuera de internet. Desde entender tu modelo de amenazas hasta configurar un hardware wallet y hacer backups seguros.',
    'Tener bitcoin en un exchange o en una wallet conectada a internet es como guardar dinero en efectivo sobre la mesa. En este curso aprenderas a mover tus fondos a cold storage: almacenamiento sin conexion que te da control total. No necesitas ser tecnico — solo necesitas criterio y un plan.',
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
  -- 3. MODULOS
  -- Columnas validas: id, course_id, title, description,
  --   order_index, requires_quiz, slug, total_duration_minutes,
  --   total_lessons, created_at, updated_at
  -- =====================================================

  -- Modulo 1: Fundamentos de Custodia
  INSERT INTO public.modules (course_id, title, description, order_index, total_lessons, total_duration_minutes)
  VALUES (
    v_course_id,
    'Fundamentos de Custodia',
    'Entiende que proteger, de quien, y que opciones tienes antes de tocar ninguna herramienta.',
    1,
    3,
    75
  )
  RETURNING id INTO v_module1_id;

  -- Modulo 2: Implementacion Practica
  INSERT INTO public.modules (course_id, title, description, order_index, total_lessons, total_duration_minutes)
  VALUES (
    v_course_id,
    'Implementacion Practica',
    'Pasa de la teoria a la accion. Configura, respalda y verifica tu setup de cold storage.',
    2,
    3,
    75
  )
  RETURNING id INTO v_module2_id;

  -- =====================================================
  -- 4. LECCIONES
  -- Columnas validas: id, module_id, course_id, title, slug,
  --   description, order_index, content, content_json,
  --   is_free_preview, video_url, video_duration_minutes,
  --   pdf_url, slides_url, resources_url, attachments,
  --   created_at, updated_at
  -- =====================================================

  -- ----- MODULO 1 -----

  -- Leccion 1.1: Hot vs Cold — Tu Modelo de Amenazas
  INSERT INTO public.lessons (module_id, course_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module1_id,
    v_course_id,
    'Hot vs Cold — Tu Modelo de Amenazas',
    'hot-vs-cold-tu-modelo-de-amenazas',
    'Entiende la diferencia entre hot y cold storage, y aprende a identificar tus propias amenazas.',
    1,
    '<p>Antes de elegir una wallet o un metodo de almacenamiento, necesitas hacerte una pregunta que muy pocos se hacen: <strong>¿de que me estoy protegiendo exactamente?</strong></p>' ||
    '<p>Eso es lo que en seguridad se llama <strong>modelo de amenazas</strong>. No es lo mismo proteger 50€ en bitcoin que proteger los ahorros de tu vida. No es lo mismo vivir solo que tener familia. No es lo mismo un usuario que opera frecuentemente que uno que compra y guarda a largo plazo.</p>' ||
    '<p><strong>Hot storage</strong> es cualquier wallet conectada a internet: la app de tu exchange, una wallet en el movil, una extension del navegador. Es comoda, rapida, y perfecta para cantidades pequenas que usas a menudo. Pero esta expuesta: si alguien compromete tu dispositivo, accede a tus fondos.</p>' ||
    '<p><strong>Cold storage</strong> es lo contrario: tus claves privadas nunca tocan internet. Pueden estar en un hardware wallet, en un dispositivo air-gapped, o incluso en un papel. Es menos comoda, pero mucho mas segura para cantidades significativas o ahorro a largo plazo.</p>' ||
    '<p>La clave no es elegir uno u otro. <strong>Es usar cada uno para lo que sirve.</strong></p>',
    true
  );

  -- Leccion 1.2: Tipos de Cold Storage
  INSERT INTO public.lessons (module_id, course_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module1_id,
    v_course_id,
    'Tipos de Cold Storage',
    'tipos-de-cold-storage',
    'Conoce las opciones de cold storage que existen y compara sus ventajas y limitaciones.',
    2,
    '<p>No todo el cold storage es igual. Existen varias formas de mantener tus claves fuera de internet, y cada una tiene ventajas, limitaciones y casos de uso diferentes.</p>' ||
    '<p>La opcion mas conocida son los <strong>hardware wallets</strong>: dispositivos fisicos disenados especificamente para firmar transacciones sin exponer tus claves. Trezor, Ledger, ColdCard, BitBox, Keystone — hay muchas opciones. Lo que tienen en comun es que tus claves se generan y viven dentro del dispositivo. Cuando quieres enviar bitcoin, el dispositivo firma la transaccion internamente y solo envia la transaccion firmada al exterior. Las claves nunca salen.</p>' ||
    '<p>Otra opcion son los <strong>dispositivos air-gapped</strong>: ordenadores o moviles que nunca se conectan a internet. Puedes usar un movil viejo con una wallet instalada, sin SIM y sin wifi. Es mas barato que un hardware wallet, pero requiere mas disciplina.</p>' ||
    '<p>Las <strong>paper wallets</strong> fueron populares hace anos: imprimes tu clave privada en papel y la guardas. El problema es que son fragiles, faciles de danar, y es muy facil cometer errores al usarlas. Hoy en dia no se recomiendan excepto en casos muy especificos.</p>' ||
    '<p>Finalmente, los <strong>steel backups</strong> (placas de metal) no son wallets en si, sino un metodo para guardar tu seed phrase de forma resistente al fuego, agua y tiempo. Son complementarios a cualquier otra solucion de cold storage.</p>' ||
    '<p>No hay una opcion perfecta universal. Lo que importa es que entiendas que te ofrece cada una y <strong>elijas con criterio</strong>.</p>',
    false
  );

  -- Leccion 1.3: Seed Phrases — Tu Llave Maestra
  INSERT INTO public.lessons (module_id, course_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module1_id,
    v_course_id,
    'Seed Phrases — Tu Llave Maestra',
    'seed-phrases-tu-llave-maestra',
    'Entiende que es una seed phrase, por que es critica, y los errores mas comunes que debes evitar.',
    3,
    '<p>Si tuvieras que recordar una sola cosa de este curso, que sea esto: <strong>tu seed phrase ES tu bitcoin</strong>. Quien la tenga, tiene tus fondos. Quien la pierda, pierde el acceso para siempre.</p>' ||
    '<p>Una <strong>seed phrase</strong> (tambien llamada frase de recuperacion o mnemonic) es una secuencia de 12 o 24 palabras en un orden especifico. Esas palabras codifican la clave maestra desde la que se generan todas tus direcciones y claves privadas. El estandar se llama BIP39, pero no necesitas saber los detalles tecnicos — lo que necesitas saber es que esas palabras lo son todo.</p>' ||
    '<p>Cuando configuras un hardware wallet o una wallet de software, el dispositivo genera tu seed phrase. Tu unico trabajo es anotarla correctamente y guardarla en un lugar seguro. Parece simple, pero es donde la mayoria de la gente comete errores.</p>' ||
    '<p><strong>Errores comunes:</strong> hacer una foto de la seed (ahora esta en tu galeria, en la nube, expuesta). Guardarla en un archivo de texto en el ordenador. Enviarla por WhatsApp "a ti mismo". Anotarla en un post-it. Guardar una copia y ningun backup. No verificar que la anotaste correctamente.</p>' ||
    '<p><strong>Reglas fundamentales:</strong> anotala en papel o metal, nunca en digital. Guardala en un lugar seguro y separado del dispositivo. Haz al menos un backup en otra ubicacion fisica. Nunca la compartas con nadie. Verifica que funciona antes de enviar fondos.</p>' ||
    '<p>Tu seed phrase es lo mas valioso que tienes en el mundo Bitcoin. <strong>Tratala como tal.</strong></p>',
    false
  );

  -- ----- MODULO 2 -----

  -- Leccion 2.1: Configurar un Hardware Wallet
  INSERT INTO public.lessons (module_id, course_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module2_id,
    v_course_id,
    'Configurar un Hardware Wallet',
    'configurar-un-hardware-wallet',
    'Aprende a elegir y configurar un hardware wallet paso a paso, con criterio.',
    1,
    '<p>Ahora que entiendes los fundamentos, es momento de pasar a la practica. En esta leccion vamos a recorrer el proceso de configuracion de un hardware wallet, paso a paso, independientemente de la marca que elijas.</p>' ||
    '<p><strong>Antes de comprar:</strong> compra siempre directamente del fabricante o de un distribuidor oficial. Nunca de segunda mano, nunca de un vendedor no verificado en Amazon o similares. Un dispositivo manipulado puede parecer nuevo pero tener firmware modificado que roba tus claves. Esto no es paranoia — ha pasado.</p>' ||
    '<p>Al recibirlo, verifica que el embalaje esta intacto y que el dispositivo no muestra signos de manipulacion. Algunos fabricantes incluyen sellos holograficos o verificacion de autenticidad por software.</p>' ||
    '<p>El proceso de configuracion es similar en todos los hardware wallets: conectas el dispositivo, instalas el <strong>software companion</strong> (Trezor Suite, Ledger Live, Sparrow, etc.), el dispositivo genera tu seed phrase, la anotas en papel/metal, la verificas, y estableces un PIN de acceso.</p>' ||
    '<p>Un punto que mucha gente pasa por alto: el software companion no es obligatorio para operar. Puedes usar tu hardware wallet con <strong>software independiente</strong> como Sparrow Wallet o Electrum. Esto reduce la dependencia de un solo fabricante y te da mas control.</p>' ||
    '<p>Despues de configurar, haz una <strong>transaccion de prueba</strong>: envia una cantidad minima, verifica que llega, verifica que puedes enviar desde el dispositivo. Solo entonces empieza a mover cantidades importantes.</p>',
    false
  );

  -- Leccion 2.2: Backup Seguro de Seeds
  INSERT INTO public.lessons (module_id, course_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module2_id,
    v_course_id,
    'Backup Seguro de Seeds',
    'backup-seguro-de-seeds',
    'Aprende a hacer backups seguros de tu seed phrase y disena una estrategia de respaldo.',
    2,
    '<p>Ya tienes tu hardware wallet configurado y tu seed anotada. Ahora viene la parte que separa a los usuarios preparados de los que perderan fondos: <strong>el backup</strong>.</p>' ||
    '<p>Una sola copia de tu seed en un solo lugar es un <strong>punto unico de fallo</strong>. Un incendio, una inundacion, un robo, o simplemente olvidar donde la guardaste, y pierdes todo. Necesitas redundancia.</p>' ||
    '<p>La regla basica es <strong>2-3 copias en ubicaciones fisicas diferentes</strong>. No todas en tu casa. Piensa en casa de un familiar de confianza, una caja de seguridad en un banco, o una ubicacion geograficamente separada.</p>' ||
    '<p><strong>El material importa.</strong> Papel funciona, pero es vulnerable al agua, fuego y deterioro con el tiempo. Las placas de metal (steel backups) resisten fuego hasta 1500°C, agua, y corrosion. Para cantidades significativas, el coste de una placa de metal (30-80€) es insignificante comparado con lo que protege.</p>' ||
    '<p><strong>Metodos de grabado en metal:</strong> hay placas donde estampas letras con un punzon, otras donde atornillas letras, y algunas donde grabas directamente. Todas funcionan. Lo importante es que sea legible, resistente, y que verifiques que anotaste correctamente.</p>' ||
    '<p><strong>Distribucion geografica:</strong> no guardes todas las copias cerca. Si tu zona sufre un desastre natural, quieres al menos una copia en otro lugar. Pero tampoco las disperses tanto que pierdas control sobre ellas.</p>' ||
    '<p>Un punto que se olvida: <strong>documenta donde estan tus backups</strong>. De nada sirve tener 3 copias si dentro de 5 anos no recuerdas donde las pusiste. Manten un registro (sin incluir la seed misma) de las ubicaciones.</p>',
    false
  );

  -- Leccion 2.3: Verificacion y Simulacro de Recuperacion
  INSERT INTO public.lessons (module_id, course_id, title, slug, description, order_index, content, is_free_preview)
  VALUES (
    v_module2_id,
    v_course_id,
    'Verificacion y Simulacro de Recuperacion',
    'verificacion-y-simulacro-de-recuperacion',
    'Aprende a verificar que tu setup funciona y haz un simulacro de recuperacion completo.',
    3,
    '<p>Esta es probablemente la leccion mas importante del curso, y la que menos gente hace. De nada sirve tener un hardware wallet configurado y 3 copias de tu seed si <strong>nunca has verificado que puedes recuperar tus fondos en caso de emergencia</strong>.</p>' ||
    '<p>Un <strong>simulacro de recuperacion</strong> es exactamente lo que suena: simulas que has perdido tu dispositivo y verificas que puedes recuperar el acceso usando solo tu seed phrase.</p>' ||
    '<p>El proceso es simple: resetea tu hardware wallet (o usa uno nuevo), selecciona "restaurar wallet existente", introduce tu seed phrase palabra por palabra, y verifica que las mismas direcciones y el mismo saldo aparecen. Si aparecen, tu backup funciona. Si no, tienes un problema que es mejor descubrir ahora y no cuando realmente lo necesites.</p>' ||
    '<p><strong>Cuando hacer un simulacro:</strong> despues de la configuracion inicial (obligatorio), cada 6-12 meses como rutina, y cada vez que cambies la ubicacion de un backup.</p>' ||
    '<p>Ademas del simulacro, manten una <strong>checklist de seguridad personal</strong>. Una lista de preguntas que revisas periodicamente: ¿Se donde estan mis backups? ¿Mis backups son legibles? ¿Alguien de confianza sabe que tengo bitcoin y como acceder si me pasa algo? ¿Mi PIN es seguro? ¿Mi firmware esta actualizado?</p>' ||
    '<p><strong>No te fies de la memoria. No te fies de la suerte. Verifica.</strong></p>',
    false
  );

  -- =====================================================
  -- 5. QUIZ QUESTIONS (18 preguntas — 3 por leccion)
  -- Columnas validas: id, module_id, question, options,
  --   correct_answer, explanation, order_index, difficulty,
  --   points, created_at, updated_at
  -- =====================================================

  -- ----- MODULO 1: Preguntas 1-9 -----

  -- Leccion 1.1 — Pregunta 1
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Que es un modelo de amenazas?',
    '["Un software que detecta virus", "Una evaluacion de que riesgos te afectan y como protegerte", "Una lista de hackers conocidos", "Un tipo de wallet"]'::jsonb,
    1,
    'Un modelo de amenazas es una evaluacion personal de los riesgos que te afectan y las medidas que necesitas para protegerte.',
    1,
    'easy',
    1
  );

  -- Leccion 1.1 — Pregunta 2
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Cual es la principal diferencia entre hot y cold storage?',
    '["El precio", "El tamano del dispositivo", "Si las claves privadas estan conectadas a internet o no", "La cantidad de bitcoin que pueden guardar"]'::jsonb,
    2,
    'La diferencia fundamental es si tus claves privadas estan expuestas a internet (hot) o completamente desconectadas (cold).',
    2,
    'easy',
    1
  );

  -- Leccion 1.1 — Pregunta 3
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Para que tipo de uso es mas adecuado el cold storage?',
    '["Compras diarias de cafe", "Trading frecuente", "Ahorro a largo plazo y cantidades significativas", "Recibir pagos en una tienda"]'::jsonb,
    2,
    'El cold storage es ideal para ahorro a largo plazo y cantidades significativas, donde la seguridad es mas importante que la comodidad.',
    3,
    'easy',
    1
  );

  -- Leccion 1.2 — Pregunta 4
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Como protege un hardware wallet tus claves privadas?',
    '["Las envia cifradas a la nube", "Las genera y mantiene dentro del dispositivo, sin exponerlas a internet", "Las divide en varios archivos", "Las protege con antivirus"]'::jsonb,
    1,
    'Un hardware wallet genera y almacena las claves dentro del dispositivo. Las transacciones se firman internamente y las claves nunca salen del dispositivo.',
    4,
    'medium',
    1
  );

  -- Leccion 1.2 — Pregunta 5
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Por que las paper wallets ya no se recomiendan como metodo principal?',
    '["Porque son ilegales", "Porque son fragiles, propensas a errores y faciles de danar", "Porque no funcionan con Bitcoin", "Porque son demasiado caras"]'::jsonb,
    1,
    'Las paper wallets son fragiles, se danan facilmente con agua o fuego, y es muy facil cometer errores al usarlas.',
    5,
    'medium',
    1
  );

  -- Leccion 1.2 — Pregunta 6
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Que es un steel backup?',
    '["Una wallet hecha de acero", "Un metodo para guardar tu seed phrase en metal resistente al fuego y agua", "Un exchange especialmente seguro", "Un tipo de hardware wallet"]'::jsonb,
    1,
    'Un steel backup es una placa de metal donde grabas tu seed phrase. Resiste fuego, agua y corrosion, protegiendo tu backup a largo plazo.',
    6,
    'easy',
    1
  );

  -- Leccion 1.3 — Pregunta 7
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Que representa tu seed phrase?',
    '["Tu contrasena del exchange", "La clave maestra desde la que se generan todas tus claves y direcciones", "Tu nombre de usuario en la blockchain", "Un codigo de verificacion temporal"]'::jsonb,
    1,
    'La seed phrase codifica la clave maestra (BIP39) desde la que se derivan todas tus claves privadas y direcciones Bitcoin.',
    7,
    'medium',
    1
  );

  -- Leccion 1.3 — Pregunta 8
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Cual de estas acciones es SEGURA para guardar tu seed phrase?',
    '["Hacer una foto con el movil", "Guardarla en un archivo en Google Drive", "Anotarla en papel y guardarla en un lugar seguro y separado del dispositivo", "Enviarla por email a ti mismo"]'::jsonb,
    2,
    'La seed phrase debe anotarse en papel o metal y guardarse en un lugar seguro, separado del dispositivo. Nunca en formato digital.',
    8,
    'medium',
    1
  );

  -- Leccion 1.3 — Pregunta 9
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module1_id,
    '¿Que pasa si pierdes tu seed phrase y tu dispositivo deja de funcionar?',
    '["Contactas al fabricante y te la recuperan", "Pierdes el acceso a tus fondos de forma permanente", "Bitcoin te genera una nueva automaticamente", "Puedes recuperarla desde la blockchain"]'::jsonb,
    1,
    'Sin tu seed phrase y sin acceso al dispositivo, tus fondos se pierden para siempre. No hay soporte tecnico ni forma de recuperacion.',
    9,
    'medium',
    1
  );

  -- ----- MODULO 2: Preguntas 1-9 -----

  -- Leccion 2.1 — Pregunta 1
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Donde debes comprar un hardware wallet?',
    '["En cualquier tienda online con buen precio", "De segunda mano para ahorrar", "Directamente del fabricante o distribuidor oficial", "En grupos de Telegram"]'::jsonb,
    2,
    'Siempre compra directamente del fabricante o de un distribuidor oficial para evitar dispositivos manipulados.',
    1,
    'easy',
    1
  );

  -- Leccion 2.1 — Pregunta 2
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Por que es importante hacer una transaccion de prueba despues de configurar?',
    '["Para ganar puntos en la wallet", "Para verificar que todo funciona antes de mover cantidades importantes", "Porque el dispositivo lo exige", "Para activar el dispositivo"]'::jsonb,
    1,
    'Una transaccion de prueba te permite verificar que todo funciona correctamente antes de confiar cantidades importantes al dispositivo.',
    2,
    'easy',
    1
  );

  -- Leccion 2.1 — Pregunta 3
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Es obligatorio usar el software companion del fabricante (ej: Ledger Live)?',
    '["Si, sin el no funciona", "No, puedes usar software independiente como Sparrow Wallet", "Solo si tienes un modelo antiguo", "Solo para Bitcoin, no para otras criptomonedas"]'::jsonb,
    1,
    'No es obligatorio. Puedes usar software independiente como Sparrow Wallet o Electrum, lo que reduce la dependencia de un solo fabricante.',
    3,
    'medium',
    1
  );

  -- Leccion 2.2 — Pregunta 4
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Cuantas copias de tu seed phrase deberias tener como minimo?',
    '["1, bien guardada", "2-3, en ubicaciones fisicas diferentes", "10, para estar seguro", "Ninguna, la memorizo"]'::jsonb,
    1,
    'La regla basica es tener 2-3 copias en ubicaciones fisicas diferentes para evitar un punto unico de fallo.',
    4,
    'easy',
    1
  );

  -- Leccion 2.2 — Pregunta 5
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Cual es la ventaja principal de un steel backup frente al papel?',
    '["Es mas barato", "Es mas facil de leer", "Resiste fuego, agua y corrosion", "Ocupa menos espacio"]'::jsonb,
    2,
    'Las placas de metal resisten fuego hasta 1500°C, agua y corrosion, ofreciendo una proteccion muy superior al papel.',
    5,
    'easy',
    1
  );

  -- Leccion 2.2 — Pregunta 6
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Que debes documentar sobre tus backups?',
    '["La seed phrase completa en un archivo digital", "Las ubicaciones donde estan guardados, sin incluir la seed", "Las contrasenas de tus exchanges", "No debes documentar nada"]'::jsonb,
    1,
    'Documenta donde estan guardados tus backups, pero nunca incluyas la seed phrase en ese registro.',
    6,
    'medium',
    1
  );

  -- Leccion 2.3 — Pregunta 7
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Que es un simulacro de recuperacion?',
    '["Instalar un antivirus en el hardware wallet", "Verificar que puedes restaurar tus fondos usando solo tu seed phrase", "Hacer una copia de seguridad del PIN", "Contactar al fabricante para verificar tu identidad"]'::jsonb,
    1,
    'Un simulacro de recuperacion consiste en resetear tu dispositivo y restaurarlo con tu seed phrase para verificar que funciona.',
    7,
    'medium',
    1
  );

  -- Leccion 2.3 — Pregunta 8
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Con que frecuencia deberias hacer un simulacro de recuperacion?',
    '["Solo una vez al configurar", "Cada semana", "Despues de configurar y luego cada 6-12 meses", "Solo si pierdes el dispositivo"]'::jsonb,
    2,
    'Se recomienda hacer un simulacro despues de la configuracion inicial y luego cada 6-12 meses como rutina.',
    8,
    'medium',
    1
  );

  -- Leccion 2.3 — Pregunta 9
  INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
  VALUES (
    v_module2_id,
    '¿Que debes verificar durante un simulacro?',
    '["Que el dispositivo enciende", "Que las mismas direcciones y saldo aparecen tras restaurar con la seed", "Que la bateria esta cargada", "Que la app del fabricante se actualiza"]'::jsonb,
    1,
    'Durante un simulacro debes verificar que al restaurar con tu seed phrase aparecen las mismas direcciones y el mismo saldo.',
    9,
    'medium',
    1
  );

  -- =====================================================
  -- 6. VINCULAR CURSO A RUTA DE APRENDIZAJE
  -- Columnas validas: id, learning_path_id, course_id,
  --   position, is_required, created_at
  -- =====================================================
  INSERT INTO public.learning_path_courses (learning_path_id, course_id, position, is_required)
  VALUES (v_path_id, v_course_id, 1, true)
  ON CONFLICT (learning_path_id, course_id) DO NOTHING;

END $$;
