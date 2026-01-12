/**
 * Script para poblar preguntas de quiz de ejemplo
 *
 * Uso:
 *   npx tsx scripts/seed-quiz-questions.ts
 *
 * Este script:
 * 1. Busca el primer curso publicado con modulos
 * 2. Crea 5 preguntas de ejemplo para el primer modulo
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface QuizQuestion {
  module_id: string
  question: string
  explanation: string
  options: string[]
  correct_answer: number
  order_index: number
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
}

const sampleQuestions: Omit<QuizQuestion, 'module_id'>[] = [
  {
    question: 'Cual es la caracteristica principal de una blockchain?',
    explanation: 'La inmutabilidad significa que una vez registrada la informacion, no puede ser alterada sin cambiar todos los bloques siguientes.',
    options: [
      'Es centralizada',
      'Los datos son mutables',
      'Es inmutable y descentralizada',
      'Solo funciona con internet rapido'
    ],
    correct_answer: 2,
    order_index: 1,
    difficulty: 'easy',
    points: 1
  },
  {
    question: 'Que es un smart contract?',
    explanation: 'Los smart contracts son programas almacenados en la blockchain que se ejecutan automaticamente cuando se cumplen condiciones predefinidas.',
    options: [
      'Un contrato legal tradicional',
      'Un programa que se ejecuta automaticamente en la blockchain',
      'Una criptomoneda especial',
      'Un tipo de wallet'
    ],
    correct_answer: 1,
    order_index: 2,
    difficulty: 'medium',
    points: 1
  },
  {
    question: 'Cual de las siguientes NO es una caracteristica de Web3?',
    explanation: 'Web3 se caracteriza por la descentralizacion, propiedad de datos por el usuario y resistencia a la censura. El control centralizado es caracteristica de Web2.',
    options: [
      'Descentralizacion',
      'Propiedad de datos por el usuario',
      'Control centralizado por empresas',
      'Resistencia a la censura'
    ],
    correct_answer: 2,
    order_index: 3,
    difficulty: 'easy',
    points: 1
  },
  {
    question: 'Que funcion cumple un nodo en una red blockchain?',
    explanation: 'Los nodos mantienen una copia de la blockchain, validan transacciones y participan en el consenso de la red.',
    options: [
      'Solo almacena criptomonedas',
      'Valida transacciones y mantiene una copia de la blockchain',
      'Crea nuevas criptomonedas automaticamente',
      'Conecta usuarios a exchanges'
    ],
    correct_answer: 1,
    order_index: 4,
    difficulty: 'medium',
    points: 1
  },
  {
    question: 'Cual es la diferencia principal entre una criptomoneda y un token?',
    explanation: 'Las criptomonedas tienen su propia blockchain nativa (BTC, ETH), mientras que los tokens operan sobre una blockchain existente.',
    options: [
      'No hay diferencia',
      'Los tokens siempre valen mas',
      'Las criptomonedas tienen blockchain propia, los tokens operan sobre blockchains existentes',
      'Los tokens son ilegales'
    ],
    correct_answer: 2,
    order_index: 5,
    difficulty: 'hard',
    points: 2
  }
]

async function seedQuizQuestions() {
  console.log('Iniciando seed de preguntas de quiz...')

  // Buscar el primer curso publicado con modulos
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      modules (
        id,
        title,
        order_index
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: true })
    .limit(5)

  if (coursesError) {
    console.error('Error buscando cursos:', coursesError)
    process.exit(1)
  }

  if (!courses || courses.length === 0) {
    console.error('No se encontraron cursos publicados')
    process.exit(1)
  }

  // Buscar un curso que tenga modulos
  let targetCourse = null
  let targetModule = null

  for (const course of courses) {
    const modules = course.modules as Array<{ id: string; title: string; order_index: number }>
    if (modules && modules.length > 0) {
      targetCourse = course
      // Ordenar modulos y tomar el primero
      targetModule = modules.sort((a, b) => a.order_index - b.order_index)[0]
      break
    }
  }

  if (!targetCourse || !targetModule) {
    console.error('No se encontro un curso con modulos')
    process.exit(1)
  }

  console.log(`Curso seleccionado: ${targetCourse.title}`)
  console.log(`Modulo seleccionado: ${targetModule.title} (${targetModule.id})`)

  // Verificar si ya existen preguntas para este modulo
  const { data: existingQuestions } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('module_id', targetModule.id)

  if (existingQuestions && existingQuestions.length > 0) {
    console.log(`El modulo ya tiene ${existingQuestions.length} preguntas. Saltando...`)
    console.log('Para re-crear las preguntas, eliminalas primero manualmente.')
    process.exit(0)
  }

  // Preparar preguntas con module_id
  const questionsToInsert: QuizQuestion[] = sampleQuestions.map((q) => ({
    ...q,
    module_id: targetModule.id
  }))

  // Insertar preguntas
  const { data: insertedQuestions, error: insertError } = await supabase
    .from('quiz_questions')
    .insert(questionsToInsert)
    .select('id, question')

  if (insertError) {
    console.error('Error insertando preguntas:', insertError)
    process.exit(1)
  }

  console.log(`Se insertaron ${insertedQuestions?.length || 0} preguntas correctamente`)
  console.log('')
  console.log('Preguntas creadas:')
  insertedQuestions?.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question.substring(0, 50)}...`)
  })

  console.log('')
  console.log('Seed completado exitosamente')
  console.log(`Puedes probar el quiz en: /cursos/${targetCourse.slug}/quiz-final`)
}

seedQuizQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
