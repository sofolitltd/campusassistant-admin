import { getApiKey } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export async function uploadFile(file: File | Blob, folder: string, filename?: string): Promise<string> {
  const fd = new FormData()
  fd.append('image', file, filename)
  fd.append('folder', folder)
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'X-API-Key': getApiKey() },
    body: fd,
  })
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.file_url || data.url
}

export async function deleteFile(url: string) {
  if (!url || url.includes('youtube.com') || url.includes('img.youtube.com')) return
  try {
    await fetch(`${API_BASE}/upload?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': getApiKey() },
    })
  } catch (err) {
    console.error("Failed to delete file:", url, err)
  }
}
