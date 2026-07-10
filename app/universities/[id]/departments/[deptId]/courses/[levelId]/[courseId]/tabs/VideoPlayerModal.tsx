"use client"

import React from "react"
import { Play, X, AlertTriangle } from "lucide-react"

export function VideoPlayerModal({ open, onClose, videoUrl, title, description }: {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  description?: string;
}) {
  if (!open) return null

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const videoId = getYoutubeId(videoUrl)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-[#1a1a1a] rounded-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-500/20 p-2">
              <Play className="h-4 w-4 text-red-600 fill-red-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate leading-none text-white">{title}</h2>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">Video Lecture</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 transition-all text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="aspect-video bg-black">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white p-8 text-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <p className="text-sm font-bold">Invalid Video URL</p>
              <p className="text-xs text-white/40">{videoUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
