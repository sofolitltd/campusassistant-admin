import { getApiUrl } from '@/lib/api'

// Uploads still bypass fetchWithAuth (it forces JSON, these send multipart),
// but they must go through the same base URL — in the browser that is the
// same-origin /api/backend proxy, which attaches the API key and bearer token
// server-side. Talking to the backend host directly from here would send an
// unauthenticated request. Resolved per call, not at module load, so importing
// this file never throws on a missing env var.

export async function uploadFile(file: File | Blob, folder: string, filename?: string): Promise<string> {
  const fd = new FormData()
  fd.append('image', file, filename)
  fd.append('folder', folder)
  const res = await fetch(`${getApiUrl()}/upload`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.file_url || data.url
}

export async function deleteFile(url: string) {
  if (!url || url.includes('youtube.com') || url.includes('img.youtube.com')) return
  try {
    await fetch(`${getApiUrl()}/upload?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
    })
  } catch (err) {
    console.error("Failed to delete file:", url, err)
  }
}
