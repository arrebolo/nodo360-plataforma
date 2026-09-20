// Quiz system components
//
// Solo queda CourseFinalQuiz, el unico componente de quiz que renderiza una
// pagina (app/cursos/[slug]/quiz-final/page.tsx).
//
// Se eliminaron dos grupos de codigo muerto (20/09/2026):
//   - Esquema inexistente: QuizEditor, QuestionEditor, QuizPlayer,
//     QuizResultsDisplay. Operaban sobre quizzes, quiz_answers y quiz_options,
//     tablas que no existen en la base de datos.
//   - Sin uso: ModuleQuiz, QuizInterface, QuizResults, QuizStartCard,
//     QuizStartWrapper. Seguian el esquema actual pero no los renderizaba
//     nadie; QuizResults ademas corregia en el navegador comparando contra
//     correct_answer, justo lo que se elimino en fix/rls-quiz-security.
//
// El esquema vigente es quiz_questions + quiz_attempts. El editor del panel
// admin vive aparte, en components/admin/CourseQuizEditor.tsx.

export { CourseFinalQuiz } from './CourseFinalQuiz'
