import { Suspense } from "react"
import { api } from "@/lib/api"
import UniversitiesClient from "./universities-client"
import { Loader2 } from "lucide-react"

export const metadata = {
  title: "Universities | Campus Assistant",
  description: "Manage and monitor partner universities.",
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function UniversitiesPage({ searchParams }: Props) {
  const params = await searchParams
  const searchTerm = typeof params.search === "string" ? params.search : ""
  
  // Fetch universities on the server with preloading enabled
  // This ensures we get department/session counts in one request
  const universities = await api.universities.getAll(
    `preload=true${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`
  )

  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UniversitiesClient initialUniversities={universities} />
    </Suspense>
  )
}
