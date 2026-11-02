import { api } from "@/lib/api"
import LogsClient from "./logs-client"

export default async function LogsPage() {
  const [logs, stats] = await Promise.all([
    api.systemLogs.getAll(),
    api.systemLogs.getStats(),
  ])
  const audit = await api.auditLogs.getAll().catch(() => ({ data: [], count: 0 }))

  return (
    <LogsClient
      initialLogs={logs.data}
      initialCount={logs.count}
      initialStats={stats}
      initialAuditLogs={audit.data}
      initialAuditCount={audit.count}
    />
  )
}

export const dynamic = "force-dynamic"
