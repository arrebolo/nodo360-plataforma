import { createClient } from "@/lib/supabase/server";

export interface UnlockResult {
  success: boolean;
  nextModule?: {
    id: string;
    title: string;
    slug: string;
    order_index: number;
  };
  message?: string;
  error?: string;
}

/**
 * Unlock next module after passing quiz
 *
 * Flow:
 * 1. User passes quiz (score >= 70%)
 * 2. System checks if there's a next module
 * 3. If course is premium and next module exists, it's automatically accessible
 * 4. If course is free and trying to access module 2+, show upgrade prompt
 *
 * @param userId - User ID
 * @param currentModuleId - Current module that was just completed
 * @returns Unlock result with next module info
 *
 * @example
 * ```typescript
 * const result = await unlockNextModule(userId, moduleId);
 * if (result.success && result.nextModule) {
 *   console.log('Next module unlocked:', result.nextModule.title);
 *   router.push(`/cursos/${courseSlug}/modulos/${result.nextModule.slug}`);
 * }
 * ```
 */
export async function unlockNextModule(
  userId: string,
  currentModuleId: string
): Promise<UnlockResult> {
  try {
    const supabase = await createClient();

    // Get current module info
    const { data: currentModule, error: moduleError } = await supabase
      .from("modules")
      .select("id, order_index, course_id, courses(is_free, title)")
      .eq("id", currentModuleId)
      .single();

    if (moduleError || !currentModule) {
      return {
        success: false,
        error: "Módulo actual no encontrado",
      };
    }

    const currentModuleData = currentModule as any;
    const courseIsFree = currentModuleData.courses?.is_free || false;

    // Get next module
    const { data: nextModule, error: nextModuleError } = await supabase
      .from("modules")
      .select("id, title, slug, order_index")
      .eq("course_id", currentModuleData.course_id)
      .eq("order_index", currentModuleData.order_index + 1)
      .single();

    // No next module - course completed!
    if (nextModuleError || !nextModule) {
      return {
        success: true,
        message: "¡Has completado todos los módulos del curso!",
      };
    }

    // Free course - only module 1 is accessible
    if (courseIsFree && nextModule.order_index > 1) {
      return {
        success: false,
        nextModule,
        message:
          "Actualiza a Premium para acceder a todos los módulos del curso",
      };
    }

    // Premium course or module 1 - next module is accessible
    return {
      success: true,
      nextModule,
      message: `¡Módulo "${nextModule.title}" desbloqueado!`,
    };
  } catch (error) {
    console.error("Error unlocking next module:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al desbloquear módulo",
    };
  }
}

/**
 * Check if all modules in a course are completed
 *
 * Used to determine if user should receive course certificate
 *
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns True if all required modules are completed
 */
export async function areAllModulesCompleted(
  userId: string,
  courseId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get all modules that require quiz
    const { data: requiredModules, error: modulesError } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", courseId)
      .eq("requires_quiz", true);

    if (modulesError || !requiredModules || requiredModules.length === 0) {
      return false;
    }

    // Check if user has passed all required modules
    for (const mod of requiredModules) {
      const { data: passed } = await supabase.rpc("has_passed_module_quiz", {
        p_user_id: userId,
        p_module_id: mod.id,
      });

      if (!passed) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking module completion:", error);
    return false;
  }
}

/**
 * Get progress summary for a course
 *
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns Progress summary
 */
export async function getCourseProgress(userId: string, courseId: string) {
  try {
    const supabase = await createClient();

    // Get all modules
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("id, title, requires_quiz, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (modulesError || !modules) {
      throw modulesError;
    }

    const totalModules = modules.length;
    const modulesWithQuiz = modules.filter((m) => m.requires_quiz).length;

    // Check completion for each module
    let completedModules = 0;
    const moduleStatus: Record<
      string,
      { completed: boolean; score?: number }
    > = {};

    for (const mod of modules) {
      if (mod.requires_quiz) {
        const { data: attempt } = await supabase.rpc(
          "get_best_quiz_attempt",
          {
            p_user_id: userId,
            p_module_id: mod.id,
          }
        );

        if (attempt && attempt.passed) {
          completedModules++;
          moduleStatus[mod.id] = {
            completed: true,
            score: attempt.score,
          };
        } else {
          moduleStatus[mod.id] = { completed: false };
        }
      }
    }

    const progress =
      modulesWithQuiz > 0
        ? Math.round((completedModules / modulesWithQuiz) * 100)
        : 0;

    return {
      totalModules,
      modulesWithQuiz,
      completedModules,
      progress,
      moduleStatus,
      allCompleted: completedModules === modulesWithQuiz && modulesWithQuiz > 0,
    };
  } catch (error) {
    console.error("Error getting course progress:", error);
    throw error;
  }
}


