/**
 * Certificate Generator - Complete Flow
 *
 * Handles the complete certificate generation process:
 * 1. Generate PDF with jsPDF
 * 2. Upload to Supabase Storage
 * 3. Save URL in certificates table
 * 4. Return complete certificate record
 */

import { createClient } from "@/lib/supabase/server";
import { generateCertificatePDF, type CertificateData } from "./generateCertificate";
import { uploadCertificateServer, getCertificatePath } from "./storage";
import crypto from "crypto";

export interface GenerateCertificateParams {
  userId: string;
  courseId: string;
  moduleId?: string;
  type: "module" | "course";
  quizAttemptId?: string; // For module certificates
}

export interface GenerateCertificateResult {
  success: boolean;
  certificateId?: string;
  certificateNumber?: string;
  certificateUrl?: string;
  verificationUrl?: string;
  error?: string;
}

/**
 * Generate a unique certificate number
 *
 * Format: NODO360-YYYY-XXXXXX
 * Where XXXXXX is a sequential number for the year
 */
async function generateCertificateNumber(): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  // Get count of certificates issued this year
  const { count, error } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .gte("issued_at", `${year}-01-01`)
    .lt("issued_at", `${year + 1}-01-01`);

  if (error) {
    console.error("Error counting certificates:", error);
  }

  const nextNumber = (count || 0) + 1;
  const paddedNumber = nextNumber.toString().padStart(6, "0");

  return `NODO360-${year}-${paddedNumber}`;
}

/**
 * Generate a unique verification code
 *
 * Used in public verification URLs
 */
function generateVerificationCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Generate and issue a complete certificate
 *
 * This is the main function to create a certificate:
 * 1. Validates prerequisites (quiz passed, module completed, etc.)
 * 2. Generates unique certificate number
 * 3. Creates PDF
 * 4. Uploads to Storage
 * 5. Saves to database
 *
 * @param params - Certificate parameters
 * @returns Generation result with certificate data or error
 *
 * @example
 * ```typescript
 * // Generate module certificate
 * const result = await generateAndIssueCertificate({
 *   userId: 'user-123',
 *   courseId: 'course-456',
 *   moduleId: 'module-789',
 *   type: 'module',
 *   quizAttemptId: 'attempt-abc'
 * });
 *
 * if (result.success) {
 *   console.log('Certificate issued:', result.certificateUrl);
 * }
 * ```
 */
export async function generateAndIssueCertificate(
  params: GenerateCertificateParams
): Promise<GenerateCertificateResult> {
  const { userId, courseId, moduleId, type, quizAttemptId } = params;

  try {
    const supabase = await createClient();

    // 1. VALIDATE PREREQUISITES
    if (type === "module") {
      if (!moduleId || !quizAttemptId) {
        return {
          success: false,
          error: "Module ID and quiz attempt ID required for module certificates",
        };
      }

      // Verify quiz was passed
      const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select("passed, score")
        .eq("id", quizAttemptId)
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .single();

      if (attemptError || !attempt) {
        return {
          success: false,
          error: "Quiz attempt not found",
        };
      }

      if (!attempt.passed) {
        return {
          success: false,
          error: "Quiz must be passed to issue certificate",
        };
      }
    }

    // 2. CHECK IF CERTIFICATE ALREADY EXISTS
    const existingQuery = supabase
      .from("certificates")
      .select("id, certificate_number, certificate_url, verification_url")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("type", type);

    if (type === "module" && moduleId) {
      existingQuery.eq("module_id", moduleId);
    } else {
      existingQuery.is("module_id", null);
    }

    const { data: existing, error: existingError } = await existingQuery.single();

    if (existing && !existingError) {
      // Certificate already exists, return it
      return {
        success: true,
        certificateId: existing.id,
        certificateNumber: existing.certificate_number,
        certificateUrl: existing.certificate_url || undefined,
        verificationUrl: existing.verification_url || undefined,
      };
    }

    // 3. GET USER, COURSE, AND MODULE DATA
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    let module = null;
    if (type === "module" && moduleId) {
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("title")
        .eq("id", moduleId)
        .single();

      if (moduleError || !moduleData) {
        return {
          success: false,
          error: "Module not found",
        };
      }

      module = moduleData;
    }

    // 4. GENERATE CERTIFICATE NUMBER AND VERIFICATION CODE
    const certificateNumber = await generateCertificateNumber();
    const verificationCode = generateVerificationCode();
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/verificar/${verificationCode}`;

    // 5. CREATE CERTIFICATE RECORD IN DATABASE (without URL yet)
    const { data: certificate, error: createError } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        course_id: courseId,
        module_id: moduleId || null,
        type,
        certificate_number: certificateNumber,
        title:
          type === "module"
            ? `Certificado de Módulo: ${module?.title}`
            : `Certificado de Curso: ${course.title}`,
        description:
          type === "module"
            ? `Certificado de completación del módulo "${module?.title}" del curso "${course.title}"`
            : `Certificado de completación del curso completo "${course.title}"`,
        verification_url: verificationUrl,
        // certificate_url will be updated after upload
        // certificate_hash will be calculated from PDF
      })
      .select()
      .single();

    if (createError || !certificate) {
      console.error("Error creating certificate:", createError);
      return {
        success: false,
        error: "Failed to create certificate record",
      };
    }

    // 6. GENERATE PDF
    const certificateData: CertificateData = {
      certificateNumber,
      userName: user.full_name || user.email,
      userEmail: user.email,
      courseTitle: course.title,
      moduleTitle: module?.title,
      type,
      issuedDate: new Date(),
      verificationUrl,
    };

    const pdfBlob = await generateCertificatePDF(certificateData);

    // 7. UPLOAD TO STORAGE
    const uploadResult = await uploadCertificateServer(
      userId,
      certificate.id,
      pdfBlob,
      type
    );

    if (!uploadResult.success || !uploadResult.url) {
      // Rollback: delete certificate record
      await supabase.from("certificates").delete().eq("id", certificate.id);

      return {
        success: false,
        error: uploadResult.error || "Failed to upload certificate PDF",
      };
    }

    // 8. CALCULATE PDF HASH (SHA-256)
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const certificateHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 9. UPDATE CERTIFICATE WITH URL AND HASH
    const { error: updateError } = await supabase
      .from("certificates")
      .update({
        certificate_url: uploadResult.url,
        certificate_hash: certificateHash,
      })
      .eq("id", certificate.id);

    if (updateError) {
      console.error("Error updating certificate URL:", updateError);
      // Don't fail the whole operation, certificate is still usable
    }

    // 10. SUCCESS!
    return {
      success: true,
      certificateId: certificate.id,
      certificateNumber,
      certificateUrl: uploadResult.url,
      verificationUrl,
    };
  } catch (error) {
    console.error("Error generating certificate:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Issue module certificate after passing quiz
 *
 * Convenience wrapper for module certificates
 *
 * @param userId - User ID
 * @param moduleId - Module ID
 * @param quizAttemptId - Quiz attempt ID (must be passed)
 * @returns Generation result
 */
export async function issueModuleCertificate(
  userId: string,
  moduleId: string,
  quizAttemptId: string
): Promise<GenerateCertificateResult> {
  const supabase = await createClient();

  // Get course ID from module
  const { data: module, error } = await supabase
    .from("modules")
    .select("course_id")
    .eq("id", moduleId)
    .single();

  if (error || !module) {
    return {
      success: false,
      error: "Module not found",
    };
  }

  return generateAndIssueCertificate({
    userId,
    courseId: module.course_id,
    moduleId,
    type: "module",
    quizAttemptId,
  });
}

/**
 * Issue course certificate after completing all modules
 *
 * Validates that all required modules are completed
 *
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns Generation result
 */
export async function issueCourseCertificate(
  userId: string,
  courseId: string
): Promise<GenerateCertificateResult> {
  const supabase = await createClient();

  // Get all modules that require quiz
  const { data: requiredModules, error: modulesError } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .eq("requires_quiz", true);

  if (modulesError) {
    return {
      success: false,
      error: "Failed to fetch course modules",
    };
  }

  if (!requiredModules || requiredModules.length === 0) {
    return {
      success: false,
      error: "Course has no required modules",
    };
  }

  // Check if user has passed all required modules
  for (const module of requiredModules) {
    const { data: passed } = await supabase.rpc("has_passed_module_quiz", {
      p_user_id: userId,
      p_module_id: module.id,
    });

    if (!passed) {
      return {
        success: false,
        error: `Not all required modules completed. Module ${module.id} not passed.`,
      };
    }
  }

  // All modules passed, issue course certificate
  return generateAndIssueCertificate({
    userId,
    courseId,
    type: "course",
  });
}

/**
 * Regenerate certificate PDF
 *
 * Useful if certificate data changed or PDF needs to be recreated
 *
 * @param certificateId - Certificate ID
 * @returns Regeneration result
 */
export async function regenerateCertificatePDF(
  certificateId: string
): Promise<GenerateCertificateResult> {
  try {
    const supabase = await createClient();

    // Get certificate with related data
    const { data: certificate, error } = await supabase
      .from("certificates")
      .select(
        `
        *,
        user:users!inner(full_name, email),
        course:courses!inner(title),
        module:modules(title)
      `
      )
      .eq("id", certificateId)
      .single();

    if (error || !certificate) {
      return {
        success: false,
        error: "Certificate not found",
      };
    }

    // Generate PDF
    const certificateData: CertificateData = {
      certificateNumber: certificate.certificate_number,
      userName: certificate.user.full_name || certificate.user.email,
      userEmail: certificate.user.email,
      courseTitle: certificate.course.title,
      moduleTitle: certificate.module?.title,
      type: certificate.type as "module" | "course",
      issuedDate: new Date(certificate.issued_at),
      verificationUrl: certificate.verification_url || undefined,
    };

    const pdfBlob = await generateCertificatePDF(certificateData);

    // Upload to storage (will overwrite if exists)
    const uploadResult = await uploadCertificateServer(
      certificate.user_id,
      certificate.id,
      pdfBlob,
      certificate.type as "module" | "course"
    );

    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || "Failed to upload certificate PDF",
      };
    }

    // Calculate hash
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const certificateHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Update certificate
    const { error: updateError } = await supabase
      .from("certificates")
      .update({
        certificate_url: uploadResult.url,
        certificate_hash: certificateHash,
      })
      .eq("id", certificate.id);

    if (updateError) {
      console.error("Error updating certificate:", updateError);
    }

    return {
      success: true,
      certificateId: certificate.id,
      certificateNumber: certificate.certificate_number,
      certificateUrl: uploadResult.url,
      verificationUrl: certificate.verification_url || undefined,
    };
  } catch (error) {
    console.error("Error regenerating certificate:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
