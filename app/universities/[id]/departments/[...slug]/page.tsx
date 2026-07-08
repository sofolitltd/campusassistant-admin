import { Suspense } from "react"
import { api } from "@/lib/api"
import DepartmentDetailClient from "./department-detail-client"
import { Loader2 } from "lucide-react"

type Props = {
  params: Promise<{ id: string, slug: string[] }>
}

export default async function DepartmentDetailPage({ params }: Props) {
  const { id: universityId, slug } = await params
  const departmentId = slug[0]

  // Fetch critical metadata on the server
  // This is the "Elite" architecture: Core identity is resolved on server for instant paint
  const [department, university, banners] = await Promise.all([
    api.departments.getOne(departmentId),
    api.universities.getOne(universityId),
    api.banners.getAllByDepartment(departmentId)
  ])

  if (!department) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center text-destructive">
        <p className="font-bold">Department not found</p>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Department...</p>
      </div>
    }>
      <DepartmentDetailClient 
        department={department}
        university={university}
        initialBanners={banners}
        universityId={universityId}
        departmentId={departmentId}
      />
    </Suspense>
  )
}
