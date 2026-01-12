export interface Quiz {
  id: string
  lesson_id: string
  title: string
  description?: string
  passing_score: number
  max_attempts: number
  time_limit_minutes?: number
  shuffle_questions: boolean
  shuffle_options: boolean
  show_correct_answers: boolean
  xp_reward: number
  is_required: boolean
  created_at: string
  updated_at: string
  questions?: Question[]
}

export interface Question {
  id: string
  quiz_id: string
  question_text: string
  question_type: 'single' | 'multiple' | 'boolean'
  explanation?: string
  points: number
  order_index: number
  options?: Option[]
}

export interface Option {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  started_at: string
  completed_at?: string
  score?: number
  passed?: boolean
  time_spent_seconds?: number
  attempt_number: number
  answers?: QuizAnswer[]
}

export interface QuizAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_options: string[]
  is_correct: boolean
  points_earned: number
}

export interface QuizResult {
  attempt: QuizAttempt
  score: number
  passed: boolean
  totalPoints: number
  earnedPoints: number
  correctAnswers: number
  totalQuestions: number
  timeSpent: number
  xpEarned?: number
}
