// lib/data/lesson-micro-quizzes.ts
// Configuracion de micro-quizzes por leccion (slug)
// 100% frontend, no toca BD

import type { LessonMicroQuizQuestion } from '@/components/course/LessonMicroQuiz'

/**
 * Mapa de preguntas de micro-quiz por slug de leccion
 *
 * Para anadir preguntas a una leccion:
 * 1. Anade el slug de la leccion como clave
 * 2. Anade un array de 1-3 preguntas
 *
 * Ejemplo:
 * 'mi-leccion-slug': [
 *   {
 *     id: 'q1',
 *     question: 'Pregunta aqui?',
 *     options: ['Opcion A', 'Opcion B', 'Opcion C', 'Opcion D'],
 *     correctIndex: 1, // Indice de la opcion correcta (0-3)
 *   },
 * ]
 */
export const lessonMicroQuizzes: Record<string, LessonMicroQuizQuestion[]> = {
  // =====================================================
  // CURSO: bitcoin-para-principiantes
  // =====================================================

  // Ejemplo - Leccion: que-es-bitcoin
  'que-es-bitcoin': [
    {
      id: 'bpp-1-q1',
      question: 'Que es Bitcoin principalmente?',
      options: [
        'Una empresa tecnologica',
        'Una criptomoneda y protocolo descentralizado',
        'Una aplicacion bancaria',
        'Una base de datos de un banco central',
      ],
      correctIndex: 1,
    },
    {
      id: 'bpp-1-q2',
      question: 'Quien controla la red de Bitcoin?',
      options: [
        'Un gobierno central',
        'Una empresa privada',
        'Nadie en particular, es descentralizada',
        'Los bancos internacionales',
      ],
      correctIndex: 2,
    },
  ],

  // Ejemplo - Leccion: historia-bitcoin
  'historia-bitcoin': [
    {
      id: 'bpp-2-q1',
      question: 'En que ano se publico el whitepaper de Bitcoin?',
      options: ['2005', '2008', '2011', '2015'],
      correctIndex: 1,
    },
    {
      id: 'bpp-2-q2',
      question: 'Quien publico el whitepaper de Bitcoin?',
      options: [
        'Vitalik Buterin',
        'Satoshi Nakamoto',
        'Elon Musk',
        'Mark Zuckerberg',
      ],
      correctIndex: 1,
    },
  ],

  // Ejemplo - Leccion: como-funciona-blockchain
  'como-funciona-blockchain': [
    {
      id: 'bpp-3-q1',
      question: 'Que tecnologia utiliza Bitcoin para registrar transacciones?',
      options: [
        'Base de datos SQL',
        'Blockchain (cadena de bloques)',
        'Excel en la nube',
        'Documentos en papel',
      ],
      correctIndex: 1,
    },
    {
      id: 'bpp-3-q2',
      question: 'Que son los mineros en Bitcoin?',
      options: [
        'Personas que buscan oro',
        'Computadoras que validan transacciones',
        'Empleados de bancos',
        'Aplicaciones de mensajeria',
      ],
      correctIndex: 1,
    },
  ],

  // =====================================================
  // INSTRUCCIONES PARA ANADIR MAS LECCIONES
  // =====================================================
  //
  // 1. Encuentra el slug de la leccion en la BD o URL
  // 2. Anade una entrada aqui con el formato:
  //
  // 'slug-de-la-leccion': [
  //   {
  //     id: 'unico-id',
  //     question: 'Tu pregunta?',
  //     options: ['A', 'B', 'C', 'D'],
  //     correctIndex: 0, // 0=A, 1=B, 2=C, 3=D
  //   },
  // ],
  //
  // =====================================================
}

/**
 * Obtiene las preguntas de micro-quiz para una leccion
 */
export function getMicroQuizQuestions(lessonSlug: string): LessonMicroQuizQuestion[] {
  return lessonMicroQuizzes[lessonSlug] ?? []
}
