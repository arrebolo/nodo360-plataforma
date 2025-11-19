import { createClient } from "@/lib/supabase/server";

export interface QuizSubmissionValidation {
  valid: boolean;
  error?: string;
  details?: {
    userAuthenticated: boolean;
    hasModuleAccess: boolean;
    answersValid: boolean;
  };
}

/**
 * Validate quiz submission before processing
 *
 * Checks:
 * 1. User is authenticated
 * 2. User has access to the module
 * 3. All answers are valid (0-3 range)
 * 4. No duplicate submissions in short timeframe
 *
 * @param userId - User ID
 * @param moduleId - Module ID
 * @param answers - Array of answers {questionId, selectedAnswer}
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const validation = await validateQuizSubmission(userId, moduleId, answers);
 * if (!validation.valid) {
 *   throw new Error(validation.error);
 * }
 * // Process quiz submission
 * ```
 */
export async function validateQuizSubmission(
  userId: string | null,
  moduleId: string,
  answers: Array<{ questionId: string; selectedAnswer: number }>
): Promise<QuizSubmissionValidation> {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    if (!userId) {
      return {
        valid: false,
        error: "Debes iniciar sesión para enviar el quiz",
        details: {
          userAuthenticated: false,
          hasModuleAccess: false,
          answersValid: false,
        },
      };
    }

    // 2. Check module access
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .select("id, course_id, requires_quiz, courses(is_free)")
      .eq("id", moduleId)
      .single();

    if (moduleError || !module) {
      return {
        valid: false,
        error: "Módulo no encontrado",
        details: {
          userAuthenticated: true,
          hasModuleAccess: false,
          answersValid: false,
        },
      };
    }

    // Check if module requires quiz
    if (!module.requires_quiz) {
      return {
        valid: false,
        error: "Este módulo no requiere quiz",
        details: {
          userAuthenticated: true,
          hasModuleAccess: true,
          answersValid: false,
        },
      };
    }

    // 3. Validate answers
    if (!answers || answers.length === 0) {
      return {
        valid: false,
        error: "Debes responder al menos una pregunta",
        details: {
          userAuthenticated: true,
          hasModuleAccess: true,
          answersValid: false,
        },
      };
    }

    // Check all answers are in valid range (0-3)
    const invalidAnswers = answers.filter(
      (a) => a.selectedAnswer < 0 || a.selectedAnswer > 3
    );

    if (invalidAnswers.length > 0) {
      return {
        valid: false,
        error: "Respuestas inválidas detectadas",
        details: {
          userAuthenticated: true,
          hasModuleAccess: true,
          answersValid: false,
        },
      };
    }

    // Get quiz questions to validate question IDs
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id")
      .eq("module_id", moduleId);

    if (questionsError || !questions) {
      return {
        valid: false,
        error: "No se encontraron preguntas para este módulo",
        details: {
          userAuthenticated: true,
          hasModuleAccess: true,
          answersValid: false,
        },
      };
    }

    const validQuestionIds = new Set(questions.map((q) => q.id));
    const invalidQuestions = answers.filter(
      (a) => !validQuestionIds.has(a.questionId)
    );

    if (invalidQuestions.length > 0) {
      return {
        valid: false,
        error: "IDs de preguntas inválidos",
        details: {
          userAuthenticated: true,
          hasModuleAccess: true,
          answersValid: false,
        },
      };
    }

    // Check for all questions answered
    if (answers.length !== questions.length) {
      return {
        valid: false,
        error: `Debes responder todas las preguntas (${answers.length}/${questions.length})`,
        details: {
          userAuthenticated: true,
          hasModuleAccess: true,
          answersValid: false,
        },
      };
    }

    // 4. Check for duplicate submissions (within last 5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

    const { data: recentAttempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .gte("created_at", fiveSecondsAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!attemptsError && recentAttempts && recentAttempts.length > 0) {
      return {
        valid: false,
        error:
          "Espera unos segundos antes de enviar otro intento del quiz",
        details: {
          userAuthenticated: true,
          hasModuleAccess: true,
          answersValid: true,
        },
      };
    }

    // All validations passed
    return {
      valid: true,
      details: {
        userAuthenticated: true,
        hasModuleAccess: true,
        answersValid: true,
      },
    };
  } catch (error) {
    console.error("Error validating quiz submission:", error);
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : "Error validando el envío del quiz",
    };
  }
}

/**
 * Check rate limiting for quiz attempts
 *
 * Prevents abuse by limiting attempts per time period
 *
 * @param userId - User ID
 * @param moduleId - Module ID
 * @param maxAttemptsPerHour - Maximum attempts allowed per hour (default: 5)
 * @returns True if rate limit exceeded
 */
export async function isRateLimited(
  userId: string,
  moduleId: string,
  maxAttemptsPerHour: number = 5
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { data: attempts, error } = await supabase
      .from("quiz_attempts")
      .select("id")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .gte("created_at", oneHourAgo);

    if (error) {
      console.error("Error checking rate limit:", error);
      return false; // Don't block on error
    }

    return (attempts?.length || 0) >= maxAttemptsPerHour;
  } catch (error) {
    console.error("Error in rate limit check:", error);
    return false;
  }
}
