import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import CourseDetailClient from "./course-detail-client"

type Props = {
  params: Promise<{
    id: string
    deptId: string
    levelId: string
    courseId: string
  }>
  searchParams: Promise<{
    levelName?: string
    courseCode?: string
    courseTitle?: string
    deptSlug?: string
  }>
}

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const { id: universityId, deptId: departmentId, levelId, courseId } = await params
  const {
    levelName: levelNameParam,
    courseCode = "",
    courseTitle = "Course Details",
  } = await searchParams
  // Fall back to the level's real name — the back link to the course list
  // carries this value, so a missing one would leak the raw ID there.
  const levelName = levelNameParam || (await api.levels.getOne(levelId).then((l) => l.name).catch(() => levelId))

  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center gap-4 flex-col">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Course…</p>
      </div>
    }>
      <CourseDetailClient
        universityId={universityId}
        departmentId={departmentId}
        levelId={levelId}
        levelName={levelName}
        courseId={courseId}
        initialCourseCode={courseCode}
        initialCourseTitle={courseTitle}
      />
    </Suspense>
  )
}
