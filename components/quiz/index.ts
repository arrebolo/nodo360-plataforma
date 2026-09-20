// Quiz system components
//
// Los componentes del esquema antiguo (QuizEditor, QuestionEditor, QuizPlayer,
// QuizResultsDisplay) se eliminaron: operaban sobre las tablas quizzes,
// quiz_answers y quiz_options, que no existen en la base de datos.
// El esquema vigente es quiz_questions + quiz_attempts.

export { CourseFinalQuiz } from './CourseFinalQuiz'

// Sin uso actualmente, conservados a la espera de decision:
export { QuizInterface } from './QuizInterface'
export { QuizResults } from './QuizResults'
export { QuizStartCard } from './QuizStartCard'
export { QuizStartWrapper } from './QuizStartWrapper'
export { ModuleQuiz } from './ModuleQuiz'
