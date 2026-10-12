import { api } from "@/lib/api"
import LogsClient from "./logs-client"

export default async function LogsPage() {
  const [logs, stats] = await Promise.all([
    api.systemLogs.getAll(),
    api.systemLogs.getStats(),
  ])

  return <LogsClient initialLogs={logs.data} initialCount={logs.count} initialStats={stats} />
}

export const dynamic = "force-dynamic"
