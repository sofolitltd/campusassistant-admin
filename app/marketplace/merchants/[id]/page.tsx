import { Suspense } from "react"
import { notFound } from "next/navigation"
import { api } from "@/lib/api"
import MerchantDetailClient from "./merchant-detail-client"
import { Loader2 } from "lucide-react"

export default async function MerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const merchant = await api.merchants.getById(id).catch(() => null)
  if (!merchant) notFound()

  const products = await api.products.getAll(id).catch(() => [])

  return (
    <Suspense fallback={
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black animate-pulse text-muted-foreground uppercase tracking-[0.3em]">Loading Merchant...</p>
      </div>
    }>
      <MerchantDetailClient merchant={merchant} initialProducts={products} />
    </Suspense>
  )
}
