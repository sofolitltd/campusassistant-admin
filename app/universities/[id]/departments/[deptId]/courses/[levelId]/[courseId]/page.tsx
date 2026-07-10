import { Suspense } from "react"
import { Loader2 } from "lucide-react"
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
    levelName = levelId,
    courseCode = "",
    courseTitle = "Course Details",
  } = await searchParams

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
