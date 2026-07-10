"use client"

import React, { useState, useEffect, useRef } from "react"
import { FileText, ExternalLink, X, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

export function PdfViewerModal({ open, onClose, url, title }: { open: boolean; onClose: () => void; url: string; title: string }) {
  const [zoom, setZoom] = useState<string>("page-fit")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err))
    } else {
      document.exitFullscreen()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div ref={containerRef} className="relative w-full h-full max-w-6xl bg-background rounded-sm shadow-2xl flex flex-col overflow-hidden border animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-sm bg-primary/10 p-1.5">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-bold truncate leading-none">{title}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Zoom</span>
              <select 
                value={zoom} 
                onChange={(e) => setZoom(e.target.value)}
                className="bg-muted/50 rounded-sm px-2 py-1 text-[10px] font-bold border-none focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
                <option value="200">200%</option>
                <option value="page-fit">Fit Page</option>
                <option value="page-width">Fit Width</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l pl-4">
              <button 
                onClick={toggleFullscreen}
                className="rounded-sm p-1.5 hover:bg-muted transition-all text-muted-foreground hover:text-primary"
                title="Toggle Fullscreen"
              >
                <Layers className={cn("h-4 w-4 transition-transform", isFullscreen && "rotate-180")} />
              </button>
              <button 
                onClick={onClose} 
                className="rounded-full p-1.5 hover:bg-muted transition-all text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-muted/30 relative">
          <iframe 
            key={`${url}-${zoom}`}
            src={`${url}#view=${zoom === 'page-fit' ? 'Fit' : zoom === 'page-width' ? 'FitH' : ''}&zoom=${!isNaN(Number(zoom)) ? zoom : ''}&toolbar=0&navpanes=0`} 
            className="w-full h-full border-none"
            title={title}
          />
        </div>

        <div className="px-4 py-1.5 bg-muted/10 border-t flex items-center justify-center">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">Hardware Accelerated Preview</p>
        </div>
      </div>
    </div>
  )
}
