import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import VerificationDetailClient from "./verification-detail-client"

export default async function VerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const data = await api.studentVerifications.getById(id).catch(() => null)
  if (!data) notFound()

  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    }>
      <VerificationDetailClient initialRequest={data.request} initialMatch={data.match} />
    </Suspense>
  )
}
