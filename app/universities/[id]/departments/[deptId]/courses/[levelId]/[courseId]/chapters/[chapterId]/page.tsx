import { Suspense } from "react"
import ChapterDetailClient from "./chapter-detail-client"
import { api } from "@/lib/api"

interface PageProps {
  params: Promise<{
    id: string
    deptId: string
    levelId: string
    courseId: string
    chapterId: string
  }>
  searchParams: Promise<{
    chapterNo?: string
    chapterTitle?: string
  }>
}

export default async function ChapterDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading Chapter...</div>}>
      <ChapterDetailClient
        universityId={resolvedParams.id}
        departmentId={resolvedParams.deptId}
        levelId={resolvedParams.levelId}
        courseId={resolvedParams.courseId}
        chapterId={resolvedParams.chapterId}
        initialChapterNo={parseInt(resolvedSearchParams.chapterNo || "0")}
        initialChapterTitle={resolvedSearchParams.chapterTitle || "Chapter Details"}
      />
    </Suspense>
  )
}
