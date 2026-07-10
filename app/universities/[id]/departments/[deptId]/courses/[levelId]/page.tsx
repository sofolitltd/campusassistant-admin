import { Suspense } from "react"
import { api } from "@/lib/api"
import CoursesClient from "./courses-client"
import { Loader2 } from "lucide-react"

type Props = {
  params: Promise<{ id: string; deptId: string; levelId: string }>
  searchParams: Promise<{ levelName?: string; deptSlug?: string }>
}

export default async function CoursesPage({ params, searchParams }: Props) {
  const { id: universityId, deptId: departmentId, levelId } = await params
  const { levelName = levelId, deptSlug } = await searchParams

  const departmentSlug = deptSlug ?? departmentId

  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center gap-4 flex-col">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Courses…</p>
      </div>
    }>
      <CoursesClient
        universityId={universityId}
        departmentId={departmentId}
        levelId={levelId}
        levelName={levelName}
        departmentSlug={departmentSlug}
      />
    </Suspense>
  )
}
