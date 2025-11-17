import { supabase } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Certificate Storage Service
 *
 * Manages certificate PDF files in Supabase Storage
 * Bucket: certificates
 * Structure: certificates/{type}/{user_id}/{certificate_id}.pdf
 */

const BUCKET_NAME = "certificates";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

export interface UploadCertificateResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface CertificateStorageMetadata {
  userId: string;
  certificateId: string;
  type: "module" | "course";
  size: number;
  uploadedAt: Date;
}

/**
 * Get the storage path for a certificate
 *
 * @param userId - User ID who owns the certificate
 * @param certificateId - Certificate ID
 * @param type - Certificate type (module or course)
 * @returns Storage path
 *
 * @example
 * ```typescript
 * const path = getCertificatePath('user-123', 'cert-456', 'module');
 * // Returns: 'modules/user-123/cert-456.pdf'
 * ```
 */
export function getCertificatePath(
  userId: string,
  certificateId: string,
  type: "module" | "course"
): string {
  const folder = type === "module" ? "modules" : "courses";
  return `${folder}/${userId}/${certificateId}.pdf`;
}

/**
 * Upload a certificate PDF to Supabase Storage
 *
 * @param userId - User ID who owns the certificate
 * @param certificateId - Certificate ID
 * @param pdfBlob - PDF file as Blob
 * @param type - Certificate type
 * @returns Upload result with URL or error
 *
 * @example
 * ```typescript
 * const pdfBlob = await generateCertificatePDF(data);
 * const result = await uploadCertificate(
 *   'user-123',
 *   'cert-456',
 *   pdfBlob,
 *   'module'
 * );
 *
 * if (result.success) {
 *   console.log('Certificate uploaded:', result.url);
 * } else {
 *   console.error('Upload failed:', result.error);
 * }
 * ```
 */
export async function uploadCertificate(
  userId: string,
  certificateId: string,
  pdfBlob: Blob,
  type: "module" | "course"
): Promise<UploadCertificateResult> {
  try {
    // Validate file size
    if (pdfBlob.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `Certificate PDF exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Validate MIME type
    if (pdfBlob.type !== "application/pdf") {
      return {
        success: false,
        error: "File must be a PDF",
      };
    }

    const path = getCertificatePath(userId, certificateId, type);

    // Upload to Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, pdfBlob, {
        contentType: "application/pdf",
        cacheControl: "public, max-age=31536000", // 1 year cache
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error("Storage upload error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("Upload certificate error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Upload certificate from server-side (Server Actions, API Routes)
 *
 * Use this version in Server Components or API routes
 */
export async function uploadCertificateServer(
  userId: string,
  certificateId: string,
  pdfBlob: Blob,
  type: "module" | "course"
): Promise<UploadCertificateResult> {
  try {
    if (pdfBlob.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `Certificate PDF exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    if (pdfBlob.type !== "application/pdf") {
      return {
        success: false,
        error: "File must be a PDF",
      };
    }

    const supabase = await createServerClient();
    const path = getCertificatePath(userId, certificateId, type);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, pdfBlob, {
        contentType: "application/pdf",
        cacheControl: "public, max-age=31536000",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("Upload certificate error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get the public URL for a certificate
 *
 * @param certificateId - Certificate ID
 * @param userId - User ID who owns the certificate
 * @param type - Certificate type
 * @returns Public URL or null
 *
 * @example
 * ```typescript
 * const url = await getCertificateUrl('cert-123', 'user-456', 'module');
 * if (url) {
 *   window.open(url, '_blank');
 * }
 * ```
 */
export async function getCertificateUrl(
  certificateId: string,
  userId: string,
  type: "module" | "course"
): Promise<string | null> {
  try {
    const path = getCertificatePath(userId, certificateId, type);

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    // Verify that the file exists
    const exists = await checkCertificateExists(certificateId, userId, type);

    return exists ? publicUrl : null;
  } catch (error) {
    console.error("Get certificate URL error:", error);
    return null;
  }
}

/**
 * Check if a certificate exists in storage
 *
 * @param certificateId - Certificate ID
 * @param userId - User ID
 * @param type - Certificate type
 * @returns True if exists, false otherwise
 *
 * @example
 * ```typescript
 * const exists = await checkCertificateExists('cert-123', 'user-456', 'module');
 * if (exists) {
 *   console.log('Certificate PDF is available');
 * }
 * ```
 */
export async function checkCertificateExists(
  certificateId: string,
  userId: string,
  type: "module" | "course"
): Promise<boolean> {
  try {
    const path = getCertificatePath(userId, certificateId, type);

    // Try to get file metadata
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path.split("/").slice(0, -1).join("/"), {
        limit: 1,
        search: `${certificateId}.pdf`,
      });

    return !error && data && data.length > 0;
  } catch (error) {
    console.error("Check certificate exists error:", error);
    return false;
  }
}

/**
 * Delete a certificate from storage
 *
 * Only the owner or admins can delete certificates
 *
 * @param certificateId - Certificate ID
 * @param userId - User ID (for ownership verification)
 * @param type - Certificate type
 * @returns True if deleted successfully, false otherwise
 *
 * @example
 * ```typescript
 * const deleted = await deleteCertificate('cert-123', 'user-456', 'module');
 * if (deleted) {
 *   console.log('Certificate deleted');
 * }
 * ```
 */
export async function deleteCertificate(
  certificateId: string,
  userId: string,
  type: "module" | "course"
): Promise<boolean> {
  try {
    const path = getCertificatePath(userId, certificateId, type);

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error("Delete certificate error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete certificate error:", error);
    return false;
  }
}

/**
 * Get certificate metadata from storage
 *
 * @param certificateId - Certificate ID
 * @param userId - User ID
 * @param type - Certificate type
 * @returns Metadata or null
 */
export async function getCertificateMetadata(
  certificateId: string,
  userId: string,
  type: "module" | "course"
): Promise<CertificateStorageMetadata | null> {
  try {
    const path = getCertificatePath(userId, certificateId, type);
    const folder = path.split("/").slice(0, -1).join("/");

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, {
        limit: 1,
        search: `${certificateId}.pdf`,
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    const file = data[0];

    return {
      userId,
      certificateId,
      type,
      size: file.metadata?.size || 0,
      uploadedAt: new Date(file.created_at),
    };
  } catch (error) {
    console.error("Get certificate metadata error:", error);
    return null;
  }
}

/**
 * Download certificate as blob
 *
 * Useful for client-side operations like re-uploading or processing
 *
 * @param certificateId - Certificate ID
 * @param userId - User ID
 * @param type - Certificate type
 * @returns Blob or null
 *
 * @example
 * ```typescript
 * const blob = await downloadCertificateBlob('cert-123', 'user-456', 'module');
 * if (blob) {
 *   // Create download link
 *   const url = URL.createObjectURL(blob);
 *   const a = document.createElement('a');
 *   a.href = url;
 *   a.download = 'certificate.pdf';
 *   a.click();
 * }
 * ```
 */
export async function downloadCertificateBlob(
  certificateId: string,
  userId: string,
  type: "module" | "course"
): Promise<Blob | null> {
  try {
    const path = getCertificatePath(userId, certificateId, type);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error || !data) {
      console.error("Download certificate error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Download certificate blob error:", error);
    return null;
  }
}

/**
 * Get storage usage statistics for a user
 *
 * @param userId - User ID
 * @returns Storage stats
 */
export async function getUserStorageStats(userId: string): Promise<{
  totalFiles: number;
  totalSize: number;
  moduleCount: number;
  courseCount: number;
}> {
  try {

    // List all files in user's folders
    const { data: moduleFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`modules/${userId}`, {
        limit: 1000,
      });

    const { data: courseFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`courses/${userId}`, {
        limit: 1000,
      });

    const moduleCount = moduleFiles?.length || 0;
    const courseCount = courseFiles?.length || 0;

    const totalSize =
      (moduleFiles?.reduce(
        (sum, file) => sum + (file.metadata?.size || 0),
        0
      ) || 0) +
      (courseFiles?.reduce(
        (sum, file) => sum + (file.metadata?.size || 0),
        0
      ) || 0);

    return {
      totalFiles: moduleCount + courseCount,
      totalSize,
      moduleCount,
      courseCount,
    };
  } catch (error) {
    console.error("Get user storage stats error:", error);
    return {
      totalFiles: 0,
      totalSize: 0,
      moduleCount: 0,
      courseCount: 0,
    };
  }
}

/**
 * Validate certificate upload
 *
 * Checks if user can upload based on storage limits
 *
 * @param userId - User ID
 * @param fileSize - Size of file to upload
 * @returns Validation result
 */
export async function validateCertificateUpload(
  userId: string,
  fileSize: number
): Promise<{ valid: boolean; error?: string }> {
  // Check individual file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Get current usage
  const stats = await getUserStorageStats(userId);

  // Free tier limit: 1GB total (example - adjust based on your plan)
  const FREE_TIER_LIMIT = 1 * 1024 * 1024 * 1024; // 1GB

  if (stats.totalSize + fileSize > FREE_TIER_LIMIT) {
    return {
      valid: false,
      error: "Storage quota exceeded. Please contact support.",
    };
  }

  return { valid: true };
}
