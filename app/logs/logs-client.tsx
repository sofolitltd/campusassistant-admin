"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, OctagonAlert, RefreshCcw, Search } from "lucide-react"

import { api, type SystemLog, type SystemLogStats, type User } from "@/lib/api"
import { cn } from "@/lib/utils"

const inputCls =
  "w-full rounded-sm border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"

interface LogsClientProps {
  initialLogs: SystemLog[]
  initialCount: number
  initialStats: SystemLogStats
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "destructive" | "warning"
}) {
  return (
    <div className="rounded-sm border bg-card p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tracking-tight",
          tone === "destructive" && "text-destructive",
          tone === "warning" && "text-warning"
        )}
      >
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: number }) {
  const isServerError = status >= 500
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold",
        isServerError
          ? "bg-destructive-subtle text-destructive"
          : "bg-warning-subtle text-warning"
      )}
    >
      {status}
    </span>
  )
}

export default function LogsClient({ initialLogs, initialCount, initialStats }: LogsClientProps) {
  const [logs, setLogs] = useState(initialLogs)
  const [count, setCount] = useState(initialCount)
  const [stats, setStats] = useState(initialStats)
  const [level, setLevel] = useState<"" | "error" | "warn">("")
  const [path, setPath] = useState("")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Record<string, User | null>>({})

  useEffect(() => {
    const unresolvedIds = Array.from(
      new Set(logs.map((log) => log.user_id).filter((id): id is string => !!id && !(id in users)))
    )
    if (unresolvedIds.length === 0) return
    unresolvedIds.forEach(async (id) => {
      try {
        const user = await api.users.getOne(id)
        setUsers((prev) => ({ ...prev, [id]: user }))
      } catch {
        setUsers((prev) => ({ ...prev, [id]: null }))
      }
    })
  }, [logs, users])

  async function refresh(nextLevel = level, nextPath = path) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (nextLevel) params.set("level", nextLevel)
      if (nextPath) params.set("path", nextPath)
      const [logsRes, statsRes] = await Promise.all([
        api.systemLogs.getAll(params.toString()),
        api.systemLogs.getStats(),
      ])
      setLogs(logsRes.data)
      setCount(logsRes.count)
      setStats(statsRes)
    } catch {
      // Best-effort refresh; keep showing the last good data on failure.
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Logs</h1>
          <p className="text-sm text-muted-foreground">
            Failed requests (4xx/5xx) captured across the backend.
          </p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="flex items-center gap-2 rounded-sm border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Errors today" value={stats.today_total} />
        <StatTile label="Errors this week" value={stats.week_total} />
        <StatTile label="Server errors (5xx)" value={stats.week_server_errors} tone="destructive" />
        <StatTile label="Client errors (4xx)" value={stats.week_client_errors} tone="warning" />
      </div>

      {stats.top_failing_paths.length > 0 && (
        <div className="rounded-sm border bg-card p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Top failing endpoints this week
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.top_failing_paths.map((p) => (
              <span
                key={p.path}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium"
              >
                <code className="text-muted-foreground">{p.path}</code>
                <span className="font-bold text-destructive">{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={level}
          onChange={(e) => {
            const v = e.target.value as "" | "error" | "warn"
            setLevel(v)
            refresh(v, path)
          }}
          className="rounded-sm border bg-background px-3 py-2 text-sm"
        >
          <option value="">All levels</option>
          <option value="error">Server errors (5xx)</option>
          <option value="warn">Client errors (4xx)</option>
        </select>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && refresh(level, path)}
            onBlur={() => refresh(level, path)}
            placeholder="Filter by path..."
            className={cn(inputCls, "pl-9")}
          />
        </div>
        <span className="text-sm text-muted-foreground">{count} matching</span>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-sm border bg-card p-12 text-center">
          <OctagonAlert className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No failed requests match this filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={log.status_code} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs font-bold">{log.method}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{log.path}</td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-xs text-muted-foreground" title={log.message}>
                    {log.message || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {!log.user_id ? (
                      <span className="text-muted-foreground">—</span>
                    ) : users[log.user_id] ? (
                      <a
                        href={`/users/${log.user_id}`}
                        className="font-medium text-primary hover:underline"
                        title={users[log.user_id]?.email}
                      >
                        {`${users[log.user_id]?.first_name ?? ""} ${users[log.user_id]?.last_name ?? ""}`.trim() ||
                          users[log.user_id]?.email}
                      </a>
                    ) : users[log.user_id] === null ? (
                      <span className="font-mono text-muted-foreground" title="User not found">
                        {log.user_id.slice(0, 8)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">…</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
