"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateUploadUrl, deleteImageAction } from "@/app/actions/storage"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadZoneProps {
  value?: File | string
  onChange: (url: string | null) => void
  error?: string
}

export function ImageUploadZone({ value, onChange, error }: ImageUploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(typeof value === "string" ? value : null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Step 1: Get signed upload URL from server
      const urlResult = await generateUploadUrl(file.name, "novel-covers")

      if ("error" in urlResult) {
        throw new Error(urlResult.error)
      }

      // Step 2: Upload file directly to Supabase using signed URL
      const uploadResponse = await fetch(urlResult.signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
          "x-upsert": "false",
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      // Step 3: Update UI with public URL
      setPreview(urlResult.publicUrl)
      setUploadedPath(urlResult.path)
      onChange(urlResult.publicUrl)

      toast({
        title: "Success",
        description: "Image uploaded successfully",
        className: "bg-green-50 border-green-200",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = async () => {
    if (uploadedPath) {
      try {
        await deleteImageAction(uploadedPath)
      } catch (error) {
        console.error("Delete error:", error)
        // Continue with removal even if delete fails
      }
    }

    setPreview(null)
    setUploadedPath(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div>
      {!preview ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : error
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
          } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium text-gray-700 mb-1">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 mb-1">Upload cover image</p>
              <p className="text-xs text-gray-500">Drag and drop or click to browse</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            aria-label="Upload cover image"
            disabled={isUploading}
          />
        </div>
      ) : (
        <div className="relative inline-block">
          <img
            src={preview || "/placeholder.svg"}
            alt="Cover preview"
            className="w-[300px] h-[450px] object-cover rounded-lg border border-gray-200"
          />
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Change Image
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleRemove} disabled={isUploading}>
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            aria-label="Change cover image"
            disabled={isUploading}
          />
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">Recommended size: 600x900px, Max 5MB</p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
