"use client"

import { useState, useEffect } from "react"
import {
  PlayCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Link as LinkIcon
} from "lucide-react"
import { api, SkillVideo } from "@/lib/api"

interface SkillVideoManagerProps {
  skillId: string
}

export function SkillVideoManager({ skillId }: SkillVideoManagerProps) {
  const [videos, setVideos] = useState<SkillVideo[]>([])
  const [loading, setLoading] = useState(true)

  const [newUrl, setNewUrl] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newThumbnail, setNewThumbnail] = useState("")
  const [newDuration, setNewDuration] = useState("")
  const [fetchingInfo, setFetchingInfo] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    api.skillVideos.getBySkill(skillId)
      .then(list => setVideos(list.sort((a, b) => a.index - b.index)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [skillId])

  // Free, keyless YouTube oEmbed endpoint — same mechanism already used by
  // ResourceModal.tsx for academic video resources. No API key involved.
  async function fetchVideoInfo() {
    if (!newUrl.trim()) return
    setFetchingInfo(true)
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(newUrl)}&format=json`)
      const data = await res.json()
      if (data.title) setNewTitle(data.title)
      if (data.thumbnail_url) setNewThumbnail(data.thumbnail_url)
    } catch (err) {
      console.error("Failed to fetch video info:", err)
    } finally {
      setFetchingInfo(false)
    }
  }

  async function handleAdd() {
    if (!newUrl.trim() || !newTitle.trim()) {
      alert("Paste a YouTube URL and fetch/enter a title first.")
      return
    }
    setAdding(true)
    try {
      const created = await api.skillVideos.create({
        skill_id: skillId,
        youtube_url: newUrl.trim(),
        title: newTitle.trim(),
        thumbnail_url: newThumbnail,
        duration: newDuration.trim(),
        index: videos.length
      })
      setVideos(prev => [...prev, created])
      setNewUrl(""); setNewTitle(""); setNewThumbnail(""); setNewDuration("")
    } catch (err: any) {
      alert(`Failed to add video: ${err.message}`)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this video from the skill?")) return
    try {
      await api.skillVideos.delete(id)
      setVideos(prev => prev.filter(v => v.id !== id))
    } catch (err: any) {
      alert(`Failed to delete video: ${err.message}`)
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= videos.length) return

    const a = videos[index]
    const b = videos[targetIndex]

    try {
      const [updatedA, updatedB] = await Promise.all([
        api.skillVideos.update(a.id, { index: b.index }),
        api.skillVideos.update(b.id, { index: a.index }),
      ])
      setVideos(prev => {
        const next = [...prev]
        next[index] = updatedB
        next[targetIndex] = updatedA
        return next.sort((x, y) => x.index - y.index)
      })
    } catch (err: any) {
      alert(`Failed to reorder: ${err.message}`)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 font-semibold text-primary mb-2">
        <PlayCircle className="h-5 w-5" />
        <h2>Videos ({videos.length})</h2>
      </div>

      <div className="rounded-lg border border-dashed p-4 space-y-3 bg-muted/10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              onBlur={fetchVideoInfo}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={fetchVideoInfo}
            disabled={fetchingInfo || !newUrl.trim()}
            className="rounded-md border px-3 py-2 text-xs font-bold hover:bg-accent transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {fetchingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch Info"}
          </button>
        </div>

        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Video title (auto-filled after Fetch Info)"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />

        <div className="flex gap-2">
          <input
            value={newDuration}
            onChange={e => setNewDuration(e.target.value)}
            placeholder="Duration (optional, e.g. 12:34)"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all whitespace-nowrap"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add Video
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : videos.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No videos yet — paste a YouTube URL above to add the first one.</p>
      ) : (
        <div className="space-y-2">
          {videos.map((video, i) => (
            <div key={video.id} className="flex items-center gap-3 rounded-lg border bg-background p-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleMove(i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(i, 1)}
                  disabled={i === videos.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt={video.title} className="h-12 w-20 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="h-12 w-20 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{video.title}</p>
                {video.duration && <p className="text-[10px] text-muted-foreground">{video.duration}</p>}
              </div>

              <button
                type="button"
                onClick={() => handleDelete(video.id)}
                className="rounded-full p-1.5 text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
