import { Suspense } from "react"
import { api, User } from "@/lib/api"
import UsersClient from "./users-client"
import { USER_FILTER_KEYS } from "./filters"
import { Loader2 } from "lucide-react"

export const metadata = {
  title: "User Management | Campus Assistant",
  description: "Manage and monitor platform users.",
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams
  const searchTerm = typeof params.search === "string" ? params.search : ""
  const offset = typeof params.offset === "string" ? parseInt(params.offset) : 0
  const pageSize = 25

  // Forward only the known filter keys to the backend.
  const query = new URLSearchParams({ limit: String(pageSize), offset: String(offset), preload: "true" })
  if (searchTerm) query.set("search", searchTerm)
  for (const key of USER_FILTER_KEYS) {
    const value = params[key]
    if (typeof value === "string" && value) query.set(key, value)
  }

  // Fetch all data in parallel on the server
  // The Go backend now handles Student/Teacher linkage automatically!
  const [res, universities, departments, sessions, batches, stats] = await Promise.all([
    api.fetchWithAuth(`/users?${query.toString()}`),
    api.universities.getAll("limit=100"),
    api.departments.getAll(),
    api.sessions.getAll(),
    api.batches.getAll(),
    api.users.getStats()
  ])

  const users: User[] = res.data || []

  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UsersClient
        initialUsers={users}
        totalCount={res.count || 0}
        universities={universities}
        departments={departments}
        sessions={sessions}
        batches={batches}
        pageSize={pageSize}
        stats={stats}
      />
    </Suspense>
  )
}
