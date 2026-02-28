import { getAdminClient } from "@/lib/supabase/admin"

/**
 * Initializes the storage bucket if it doesn't exist
 * This uses the admin client to create buckets
 */
export async function initializeStorageBucket(bucketName = "images") {
  const supabase = getAdminClient()

  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

  if (!bucketExists) {
    // Create the bucket with public access
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
    })

    if (error) {
      console.error("Failed to create storage bucket:", error)
      throw new Error(`Failed to create storage bucket: ${error.message}`)
    }
  }

  return { success: true }
}

/**
 * Generates a signed upload URL for direct client-side upload to Supabase Storage
 * This bypasses the Next.js server action 1MB body size limit
 */
export async function generateUploadUrl(fileName: string, folder?: string) {
  try {
    const supabase = getAdminClient()
    const bucketName = "images"

    // Ensure bucket exists
    await initializeStorageBucket(bucketName)

    // Generate unique filename
    const fileExt = fileName.split(".").pop()
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName

    // Generate signed upload URL (valid for 60 seconds)
    const { data, error } = await supabase.storage.from(bucketName).createSignedUploadUrl(filePath)

    if (error) {
      console.error("Failed to generate upload URL:", error)
      return { error: `Failed to generate upload URL: ${error.message}` }
    }

    // Get the public URL for the file
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    return {
      signedUrl: data.signedUrl,
      path: filePath,
      publicUrl,
      token: data.token,
    }
  } catch (error) {
    console.error("Generate upload URL error:", error)
    return { error: error instanceof Error ? error.message : "Failed to generate upload URL" }
  }
}

/**
 * Deletes an image from Supabase Storage using admin client
 * This bypasses RLS policies
 */
export async function deleteImageAction(path: string) {
  try {
    const supabase = getAdminClient()
    const bucketName = "images"

    const { error } = await supabase.storage.from(bucketName).remove([path])

    if (error) {
      console.error("Delete error:", error)
      return { error: `Failed to delete image: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete action error:", error)
    return { error: error instanceof Error ? error.message : "Failed to delete image" }
  }
}
