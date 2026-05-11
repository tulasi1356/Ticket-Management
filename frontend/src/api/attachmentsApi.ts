import { apiClient } from "./client"

export async function uploadAttachmentBlob(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await apiClient("/attachments/upload", {
    method: "POST",
    body: formData,
  }) as { url: string }
  return res.url
}
