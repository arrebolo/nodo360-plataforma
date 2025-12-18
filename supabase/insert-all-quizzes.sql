-- ============================================================
-- NODO360 - INSERT ALL QUIZZES
-- Esquema: quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
-- ============================================================

-- ============================================================
-- CURSO: Bitcoin para Principiantes
-- ============================================================

-- MÓDULO 1: Fundamentos de Bitcoin (41338d4c-4c3b-4335-804e-6a6e7ce460b0)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  '41338d4c-4c3b-4335-804e-6a6e7ce460b0',
  '¿En qué año se creó Bitcoin?',
  '["2005", "2009", "2012", "2015"]',
  1,
  'Bitcoin fue creado en 2009 por Satoshi Nakamoto.',
  1,
  'easy',
  10
),
(
  '41338d4c-4c3b-4335-804e-6a6e7ce460b0',
  '¿Quién es el creador de Bitcoin?',
  '["Vitalik Buterin", "Elon Musk", "Satoshi Nakamoto", "Mark Zuckerberg"]',
  2,
  'Satoshi Nakamoto es el pseudónimo del creador de Bitcoin, cuya identidad real sigue siendo desconocida.',
  2,
  'easy',
  10
),
(
  '41338d4c-4c3b-4335-804e-6a6e7ce460b0',
  '¿Cuál es la cantidad máxima de bitcoins que existirán?',
  '["10 millones", "21 millones", "100 millones", "Ilimitados"]',
  1,
  'El protocolo de Bitcoin establece un límite de 21 millones de bitcoins.',
  3,
  'easy',
  10
),
(
  '41338d4c-4c3b-4335-804e-6a6e7ce460b0',
  '¿Por qué Bitcoin es considerado "dinero digital descentralizado"?',
  '["Porque lo controla el Banco Central", "Porque no depende de ningún gobierno ni banco central", "Porque solo existe en formato físico", "Porque solo se usa en un país"]',
  1,
  'Bitcoin no depende de ningún banco central o gobierno, funciona gracias a una red distribuida de nodos.',
  4,
  'medium',
  15
);


-- MÓDULO 2: Cómo Funciona Bitcoin (aef6be4b-855a-4d8d-91ec-7f7b6b4565f0)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  'aef6be4b-855a-4d8d-91ec-7f7b6b4565f0',
  '¿Qué es la blockchain?',
  '["Una criptomoneda", "Un banco digital", "Un registro público e inmutable de transacciones", "Una aplicación de pagos"]',
  2,
  'La blockchain es un registro público e inmutable de todas las transacciones de Bitcoin.',
  1,
  'easy',
  10
),
(
  'aef6be4b-855a-4d8d-91ec-7f7b6b4565f0',
  '¿Qué hacen los mineros de Bitcoin?',
  '["Extraen oro digital con picos", "Validan transacciones y añaden bloques a la blockchain", "Crean nuevas criptomonedas diferentes a Bitcoin", "Trabajan en minas de datos físicas"]',
  1,
  'Los mineros validan transacciones y añaden nuevos bloques a la blockchain, recibiendo bitcoins como recompensa.',
  2,
  'medium',
  15
),
(
  'aef6be4b-855a-4d8d-91ec-7f7b6b4565f0',
  '¿Cada cuánto tiempo aproximadamente se genera un nuevo bloque en Bitcoin?',
  '["1 segundo", "1 minuto", "10 minutos", "1 hora"]',
  2,
  'El protocolo de Bitcoin está diseñado para generar un bloque cada 10 minutos aproximadamente.',
  3,
  'medium',
  15
),
(
  'aef6be4b-855a-4d8d-91ec-7f7b6b4565f0',
  '¿Qué necesitas para enviar Bitcoin a alguien?',
  '["Su número de teléfono", "Su dirección de Bitcoin (clave pública)", "Su contraseña del banco", "Su número de cuenta bancaria"]',
  1,
  'Para enviar Bitcoin solo necesitas la dirección (clave pública) del destinatario.',
  4,
  'easy',
  10
);


-- ============================================================
-- CURSO: bitcoin para todos
-- ============================================================

-- MÓDULO 1: Hot Wallets vs Cold Wallets (942817fb-fb28-4e02-83b7-46b30b8d78d4)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  '942817fb-fb28-4e02-83b7-46b30b8d78d4',
  '¿Qué característica define a una Hot Wallet?',
  '["Está conectada a internet", "Nunca se conecta a internet", "Es un dispositivo físico", "Solo guarda monedas de oro"]',
  0,
  'Las Hot Wallets están conectadas a internet, lo que las hace más convenientes pero menos seguras.',
  1,
  'easy',
  10
),
(
  '942817fb-fb28-4e02-83b7-46b30b8d78d4',
  '¿Cuál es la principal ventaja de una Cold Wallet?',
  '["Es más rápida para hacer pagos", "Mayor seguridad al estar offline", "Es gratuita", "Permite hacer trading"]',
  1,
  'Las Cold Wallets ofrecen mayor seguridad al estar desconectadas de internet.',
  2,
  'easy',
  10
),
(
  '942817fb-fb28-4e02-83b7-46b30b8d78d4',
  '¿Cuál es un ejemplo de Hot Wallet?',
  '["Ledger Nano", "Trezor", "MetaMask o Trust Wallet", "Papel con la seed phrase"]',
  2,
  'Las aplicaciones móviles y extensiones de navegador como MetaMask son ejemplos de Hot Wallets.',
  3,
  'easy',
  10
),
(
  '942817fb-fb28-4e02-83b7-46b30b8d78d4',
  '¿Para qué tipo de usuario se recomienda una Cold Wallet?',
  '["Traders que operan cada día", "Hodlers que guardan a largo plazo", "Personas que no tienen criptomonedas", "Niños pequeños"]',
  1,
  'Las Cold Wallets son ideales para quienes guardan grandes cantidades a largo plazo (hodlers).',
  4,
  'medium',
  15
);


-- MÓDULO 2: Elegir y Configurar Wallet (9f24e8fe-1fe8-4dac-a456-ea1d4e22ea58)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  '9f24e8fe-1fe8-4dac-a456-ea1d4e22ea58',
  '¿Qué es la seed phrase (frase semilla)?',
  '["Tu contraseña de email", "Un código PIN de 4 dígitos", "12-24 palabras para recuperar tu wallet", "El nombre de tu wallet"]',
  2,
  'La seed phrase es un conjunto de 12-24 palabras que permite recuperar tu wallet si pierdes acceso.',
  1,
  'easy',
  10
),
(
  '9f24e8fe-1fe8-4dac-a456-ea1d4e22ea58',
  '¿Dónde deberías guardar tu seed phrase?',
  '["En un archivo en tu computadora", "En tu email como borrador", "En papel, en un lugar seguro y offline", "En tu perfil de redes sociales"]',
  2,
  'Nunca guardes tu seed phrase digitalmente. Escríbela en papel y guárdala en un lugar seguro.',
  2,
  'medium',
  15
),
(
  '9f24e8fe-1fe8-4dac-a456-ea1d4e22ea58',
  '¿Con qué frecuencia deberías hacer backup de tu wallet?',
  '["Cada vez que haces una transacción", "Solo una vez, al crear la wallet (la seed phrase)", "Cada semana", "Nunca"]',
  1,
  'Solo necesitas guardar la seed phrase una vez. Con ella puedes recuperar tu wallet siempre.',
  3,
  'medium',
  15
),
(
  '9f24e8fe-1fe8-4dac-a456-ea1d4e22ea58',
  '¿Qué debes verificar al descargar una wallet?',
  '["Que tenga muchos colores bonitos", "Que sea de la web oficial o tienda oficial de apps", "Que la recomiende un desconocido en Twitter", "Que sea la primera que aparece en Google"]',
  1,
  'Siempre descarga wallets desde fuentes oficiales para evitar versiones falsas con malware.',
  4,
  'medium',
  15
);


-- MÓDULO 3: Enviar y Recibir Bitcoin (ac56c404-b62e-4002-8607-94a7a419053f)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  'ac56c404-b62e-4002-8607-94a7a419053f',
  '¿Qué compartes con alguien para recibir Bitcoin?',
  '["Tu seed phrase", "Tu clave privada", "Tu dirección pública", "Tu contraseña de la wallet"]',
  2,
  'Compartes tu dirección pública (como un IBAN), nunca tu clave privada.',
  1,
  'easy',
  10
),
(
  'ac56c404-b62e-4002-8607-94a7a419053f',
  '¿Qué son las fees (comisiones) en Bitcoin?',
  '["Impuestos del gobierno", "Pagos a los mineros por validar transacciones", "Propinas obligatorias a Satoshi", "Multas por usar Bitcoin"]',
  1,
  'Las fees son pagos a los mineros por procesar y validar tu transacción.',
  2,
  'easy',
  10
),
(
  'ac56c404-b62e-4002-8607-94a7a419053f',
  '¿Cuántas confirmaciones se recomiendan para considerar una transacción segura?',
  '["0 confirmaciones", "1 confirmación", "6 confirmaciones", "1000 confirmaciones"]',
  2,
  'Generalmente se consideran 6 confirmaciones como estándar de seguridad.',
  3,
  'medium',
  15
),
(
  'ac56c404-b62e-4002-8607-94a7a419053f',
  '¿Se puede cancelar una transacción de Bitcoin una vez enviada?',
  '["Sí, llamando al banco", "Sí, con un botón de cancelar", "No, son irreversibles una vez confirmadas", "Sí, enviando un email a Satoshi"]',
  2,
  'Las transacciones de Bitcoin son irreversibles una vez confirmadas en la blockchain.',
  4,
  'medium',
  15
);


-- MÓDULO 4: Seguridad Avanzada (267b3743-12b5-40f6-912e-1f0c00f53899)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  '267b3743-12b5-40f6-912e-1f0c00f53899',
  '¿Qué es el phishing en el contexto de criptomonedas?',
  '["Un tipo de pez digital", "Intentos de robar datos suplantando servicios legítimos", "Una forma de minar Bitcoin", "Un exchange de criptomonedas"]',
  1,
  'El phishing son intentos de robar tus datos haciéndose pasar por servicios legítimos.',
  1,
  'easy',
  10
),
(
  '267b3743-12b5-40f6-912e-1f0c00f53899',
  '¿Qué debes hacer si alguien te pide tu seed phrase?',
  '["Dársela si parece de confianza", "Nunca compartirla, es una estafa", "Publicarla en redes sociales para verificar", "Enviarla por email encriptado"]',
  1,
  'NUNCA compartas tu seed phrase. Nadie legítimo te la pedirá jamás.',
  2,
  'easy',
  10
),
(
  '267b3743-12b5-40f6-912e-1f0c00f53899',
  '¿Qué hacer si crees que tu wallet ha sido comprometida?',
  '["Esperar a ver qué pasa", "Mover los fondos inmediatamente a una nueva wallet", "Publicar el problema en Twitter", "Apagar el ordenador y olvidarse"]',
  1,
  'Mueve inmediatamente tus fondos a una nueva wallet con nueva seed phrase.',
  3,
  'medium',
  15
),
(
  '267b3743-12b5-40f6-912e-1f0c00f53899',
  '¿Qué es el 2FA (autenticación de dos factores)?',
  '["Tener dos contraseñas iguales", "Una segunda capa de seguridad además de la contraseña", "Usar dos wallets diferentes", "Hacer dos transacciones a la vez"]',
  1,
  'Es una capa extra de seguridad que requiere dos formas de verificación.',
  4,
  'easy',
  10
);


-- ============================================================
-- CURSO: Introducción a las Criptomonedas
-- ============================================================

-- MÓDULO 1: El Mundo Cripto (565e1c5c-594b-4567-a3ad-88e3c7efb98a)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  '565e1c5c-594b-4567-a3ad-88e3c7efb98a',
  '¿Cuál es la principal diferencia entre Bitcoin y Ethereum?',
  '["No hay ninguna diferencia", "Ethereum permite smart contracts, Bitcoin se enfoca en dinero digital", "Bitcoin es más nuevo que Ethereum", "Ethereum fue creado antes que Bitcoin"]',
  1,
  'Bitcoin se enfoca en ser dinero digital, mientras Ethereum permite ejecutar smart contracts y aplicaciones descentralizadas.',
  1,
  'medium',
  15
),
(
  '565e1c5c-594b-4567-a3ad-88e3c7efb98a',
  '¿Qué significa DeFi?',
  '["Definición Financiera", "Finanzas Descentralizadas", "Dinero Ficticio", "Fondos Digitales"]',
  1,
  'DeFi significa Finanzas Descentralizadas, servicios financieros sin intermediarios tradicionales.',
  2,
  'easy',
  10
),
(
  '565e1c5c-594b-4567-a3ad-88e3c7efb98a',
  '¿Qué son las altcoins?',
  '["Monedas hechas de aluminio", "Criptomonedas alternativas a Bitcoin", "Otro nombre para Bitcoin", "Monedas antiguas"]',
  1,
  'Altcoins son todas las criptomonedas diferentes a Bitcoin.',
  3,
  'easy',
  10
),
(
  '565e1c5c-594b-4567-a3ad-88e3c7efb98a',
  '¿Qué es un smart contract?',
  '["Un contrato firmado digitalmente con un abogado", "Un programa que se ejecuta automáticamente en la blockchain", "Una tarjeta de crédito inteligente", "Un teléfono móvil con crypto"]',
  1,
  'Es un programa que se ejecuta automáticamente en la blockchain cuando se cumplen ciertas condiciones.',
  4,
  'medium',
  15
);


-- MÓDULO 2: Comprar y Guardar Cripto (dc6112ec-350b-4d3c-a038-dad99e20435a)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  'dc6112ec-350b-4d3c-a038-dad99e20435a',
  '¿Qué es un exchange de criptomonedas?',
  '["Un banco tradicional", "Una plataforma para comprar, vender e intercambiar criptos", "Una wallet de criptomonedas", "Un tipo de blockchain"]',
  1,
  'Es una plataforma donde puedes comprar, vender e intercambiar criptomonedas.',
  1,
  'easy',
  10
),
(
  'dc6112ec-350b-4d3c-a038-dad99e20435a',
  '¿Qué significa "Not your keys, not your coins"?',
  '["Que necesitas llaves físicas para las criptos", "Si no controlas las claves privadas, no controlas tus criptos", "Que las monedas son virtuales", "Que no puedes copiar criptomonedas"]',
  1,
  'Si no controlas las claves privadas (como en un exchange), no controlas realmente tus criptos.',
  2,
  'medium',
  15
),
(
  'dc6112ec-350b-4d3c-a038-dad99e20435a',
  '¿Cuál es un ejemplo de hardware wallet?',
  '["MetaMask", "Binance", "Ledger o Trezor", "PayPal"]',
  2,
  'Ledger y Trezor son los fabricantes más conocidos de hardware wallets.',
  3,
  'easy',
  10
),
(
  'dc6112ec-350b-4d3c-a038-dad99e20435a',
  '¿Es seguro dejar todas tus criptos en un exchange?',
  '["Sí, es el lugar más seguro", "No, pueden ser hackeados. Mejor tu propia wallet", "Sí, porque tienen seguro del gobierno", "Da igual donde las guardes"]',
  1,
  'No es recomendable. Los exchanges pueden ser hackeados. Mejor guarda grandes cantidades en tu propia wallet.',
  4,
  'medium',
  15
);


-- ============================================================
-- CURSO: Seguridad en Crypto: Primeros Pasos
-- ============================================================

-- MÓDULO 1: Fundamentos de Seguridad (71ea56aa-da94-4ffe-808f-4c162e12f23a)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  '71ea56aa-da94-4ffe-808f-4c162e12f23a',
  '¿Cuál es la diferencia entre clave pública y privada?',
  '["Son lo mismo", "La pública se comparte, la privada nunca", "La privada se comparte, la pública nunca", "Ninguna se debe compartir"]',
  1,
  'La clave pública es como tu IBAN (la compartes). La privada es como tu PIN (nunca la compartes).',
  1,
  'easy',
  10
),
(
  '71ea56aa-da94-4ffe-808f-4c162e12f23a',
  '¿Cuántas palabras tiene una seed phrase estándar?',
  '["4 palabras", "8 palabras", "12 o 24 palabras", "100 palabras"]',
  2,
  'Las seed phrases más comunes tienen 12 o 24 palabras.',
  2,
  'easy',
  10
),
(
  '71ea56aa-da94-4ffe-808f-4c162e12f23a',
  '¿Por qué son seguras las hardware wallets?',
  '["Porque son de metal", "Porque las claves nunca se exponen a internet", "Porque son muy caras", "Porque las fabrica Apple"]',
  1,
  'Mantienen las claves privadas en un chip aislado, nunca expuestas a internet.',
  3,
  'medium',
  15
),
(
  '71ea56aa-da94-4ffe-808f-4c162e12f23a',
  '¿Qué pasa si pierdes tu hardware wallet pero tienes la seed phrase?',
  '["Pierdes todo para siempre", "Puedes recuperar tus fondos con la seed phrase", "Tienes que llamar al fabricante", "Necesitas comprar la misma marca de hardware wallet"]',
  1,
  'Puedes recuperar todos tus fondos con la seed phrase en cualquier wallet compatible.',
  4,
  'medium',
  15
);


-- MÓDULO 2: Evitar Estafas (44c8d535-d924-41a0-b2c0-a397423597f4)
-- ------------------------------------------------------------

INSERT INTO quiz_questions (module_id, question, options, correct_answer, explanation, order_index, difficulty, points)
VALUES
(
  '44c8d535-d924-41a0-b2c0-a397423597f4',
  '¿Qué es una estafa tipo Ponzi en crypto?',
  '["Una criptomoneda italiana", "Un esquema que paga a antiguos inversores con dinero de nuevos", "Un tipo de mining pool", "Una exchange regulada"]',
  1,
  'Es un esquema donde los retornos de los primeros inversores se pagan con el dinero de los nuevos.',
  1,
  'medium',
  15
),
(
  '44c8d535-d924-41a0-b2c0-a397423597f4',
  '¿Cuál es una señal de alerta de posible estafa?',
  '["Un proyecto con código abierto en GitHub", "Promesas de ganancias garantizadas del 100% mensual", "Que el proyecto tenga varios años de historia", "Que esté listado en exchanges regulados"]',
  1,
  'Promesas de retornos garantizados muy altos son casi siempre una estafa.',
  2,
  'easy',
  10
),
(
  '44c8d535-d924-41a0-b2c0-a397423597f4',
  '¿Qué tipo de 2FA es más seguro?',
  '["SMS al teléfono", "Aplicación de autenticación (Google Authenticator, Authy)", "Email", "Ninguno, no sirve de nada"]',
  1,
  'Las apps de autenticación (Google Authenticator, Authy) son más seguras que SMS.',
  3,
  'medium',
  15
),
(
  '44c8d535-d924-41a0-b2c0-a397423597f4',
  '¿Qué debes hacer antes de enviar criptos a una dirección nueva?',
  '["Enviar todo de una vez para ahorrar fees", "Enviar una pequeña cantidad de prueba primero", "Confiar y enviar sin verificar", "Preguntar en redes sociales si la dirección es válida"]',
  1,
  'Siempre envía una pequeña cantidad de prueba primero para verificar que la dirección es correcta.',
  4,
  'easy',
  10
);


-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Verificar totales
SELECT
  'Total preguntas' as metrica,
  COUNT(*) as valor
FROM quiz_questions

UNION ALL

SELECT
  'Módulos con quiz' as metrica,
  COUNT(DISTINCT module_id) as valor
FROM quiz_questions;

-- Ver resumen por módulo
SELECT
  m.title as modulo,
  c.title as curso,
  COUNT(qq.id) as preguntas
FROM modules m
JOIN courses c ON c.id = m.course_id
LEFT JOIN quiz_questions qq ON qq.module_id = m.id
WHERE qq.id IS NOT NULL
GROUP BY m.id, m.title, c.title, m.order_index
ORDER BY c.title, m.order_index;
