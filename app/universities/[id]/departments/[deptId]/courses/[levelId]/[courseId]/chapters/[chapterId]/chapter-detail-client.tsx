"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, BookMarked, Layers, Video } from "lucide-react"
import { api, Course, Batch } from "@/lib/api"
import { cn } from "@/lib/utils"
import ResourcesTab from "../../tabs/ResourcesTab"

interface Props {
  universityId: string
  departmentId: string
  levelId: string
  courseId: string
  chapterId: string
  initialChapterNo: number
  initialChapterTitle: string
}

export default function ChapterDetailClient({
  universityId, departmentId, levelId, courseId, chapterId,
  initialChapterNo, initialChapterTitle
}: Props) {
  const [course, setCourse] = useState<Course | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"notes" | "videos">("notes")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, bats] = await Promise.all([
        api.courses.getOne(courseId),
        api.batches.getAllByDepartment(departmentId),
      ])
      setCourse(c)
      setBatches(bats)
    } catch {
      // errors handled by local state if needed
    } finally {
      setLoading(false)
    }
  }, [courseId, departmentId])

  useEffect(() => { load() }, [load])

  const courseCode = course?.course_code || ""

  const backUrl = `/universities/${universityId}/departments/${departmentId}/courses/${levelId}/${courseId}?courseCode=${encodeURIComponent(courseCode)}&courseTitle=${encodeURIComponent(course?.course_title || "")}`

  return (
    <div className="space-y-0 pb-32">
      {/* ── Header ── */}
      <div className="border-b bg-card">
        <div className="flex flex-col gap-4 px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href={backUrl}
              className="rounded-full border p-2 hover:bg-accent transition-colors shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <BookMarked className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-black text-primary uppercase tracking-widest">
                  Chapter {initialChapterNo}
                </p>
                <h1 className="text-xl font-black tracking-tight leading-tight">
                  {initialChapterTitle}
                </h1>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 mt-4">
            <button 
              onClick={() => setActiveTab("notes")}
              className={cn(
                "pb-2 text-sm font-bold transition-all border-b-2",
                activeTab === "notes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Notes
            </button>
            <button 
              onClick={() => setActiveTab("videos")}
              className={cn(
                "pb-2 text-sm font-bold transition-all border-b-2",
                activeTab === "videos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Videos
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-6">
        <div className="mb-6 border-b pb-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {activeTab === "notes" ? (
              <><Layers className="h-5 w-5 text-primary" /> Chapter Notes</>
            ) : (
              <><Video className="h-5 w-5 text-primary" /> Chapter Videos</>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === "notes" 
              ? "Upload and manage lecture notes for this specific chapter." 
              : "Manage YouTube video lectures for this specific chapter."}
          </p>
        </div>

        {courseCode ? (
          <ResourcesTab
            type={activeTab === "notes" ? "note" : "video"}
            courseCode={courseCode}
            universityId={universityId}
            departmentId={departmentId}
            batches={batches}
            lessonNo={initialChapterNo}
          />
        ) : (
          loading ? (
            <div className="animate-pulse flex h-32 items-center justify-center rounded-sm border bg-muted/20">
              Loading chapter context...
            </div>
          ) : (
            <div className="text-red-500 text-sm">Failed to load course context. Please go back and try again.</div>
          )
        )}
      </div>
    </div>
  )
}
