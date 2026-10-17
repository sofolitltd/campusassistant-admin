import { Suspense } from "react"
import { api } from "@/lib/api"
import AppVersionClient from "./app-version-client"
import { Loader2 } from "lucide-react"

export default async function AppVersionPage() {
  const config = await api.appConfig.get()

  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
      }
    >
      <AppVersionClient initialConfig={config} />
    </Suspense>
  )
}
