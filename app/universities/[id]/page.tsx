import { Suspense } from "react"
import { api } from "@/lib/api"
import UniversityDetailClient from "./university-detail-client"
import { Loader2 } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

export default async function UniversityDetailPage({ params }: Props) {
  const { id: universityId } = await params

  // Fetch all data in parallel on the server
  // This is the "Elite" architecture: One-shot fetch for all primary data
  const [university, departments, halls, faculties, banners, contacts, transports] = await Promise.all([
    api.universities.getOne(universityId, true),
    api.departments.getAllByUniversity(universityId),
    api.halls.getAllByUniversity(universityId),
    api.faculties.getAllByUniversity(universityId),
    api.banners.getAllByUniversity(universityId),
    api.emergencyContacts.getAll(`university_id=${universityId}&target_scope=University`),
    api.transports.getAllByUniversity(universityId)
  ])

  if (!university) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center text-destructive">
        <p className="font-bold">University not found</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UniversityDetailClient
        university={university}
        initialDepartments={departments}
        initialHalls={halls}
        initialFaculties={faculties}
        initialBanners={banners}
        initialContacts={contacts}
        initialTransports={transports}
        universityId={universityId}
      />
    </Suspense>
  )
  
}
