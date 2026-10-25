import { UserX } from "lucide-react"
import Link from "next/link"
import { api, User } from "@/lib/api"
import UserDetailClient from "./user-detail-client"

export const metadata = {
  title: "User Details | Campus Assistant",
  description: "Full profile, affiliation, subscription and moderation for a single user.",
}

type Props = {
  params: Promise<{ id: string }>
}

async function loadUser(id: string): Promise<User | null> {
  try {
    // Generic GetByID preloads all associations (Student/Teacher + nested
    // Batch/Session/Hall, University/Department), so no extra lookups needed.
    return await api.users.getOne(id)
  } catch {
    return null
  }
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params
  const user = await loadUser(id)

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-destructive-subtle p-3">
          <UserX className="h-6 w-6 text-destructive" />
        </div>
        <p className="font-bold">User not found</p>
        <p className="text-sm text-muted-foreground">The user may have been deleted or the link is invalid.</p>
        <Link href="/users" className="text-sm font-medium text-primary hover:underline">
          ← Back to Users
        </Link>
      </div>
    )
  }

  return <UserDetailClient user={user} />
}
