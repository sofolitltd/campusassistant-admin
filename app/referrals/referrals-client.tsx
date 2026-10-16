"use client"

import { useState } from "react"
import { Gift, KeyRound, UserPlus, BadgeCheck, Hourglass, Coins, Trophy } from "lucide-react"
import { api, ReferralAdminStats } from "@/lib/api"
import { cn } from "@/lib/utils"

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 0, label: "All time" },
]

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-sm border bg-card shadow-sm overflow-hidden", className)}>{children}</div>
}

function StatTile({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: number; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

const th = "px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground"

export default function ReferralsClient({ initialStats }: { initialStats: ReferralAdminStats }) {
  const [stats, setStats] = useState(initialStats)
  const [days, setDays] = useState(initialStats.days)
  const [loading, setLoading] = useState(false)

  async function changeRange(next: number) {
    setDays(next)
    setLoading(true)
    try {
      setStats(await api.referrals.getStats(next))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const t = stats.totals
  const windowLabel = days === 0 ? "all time" : `last ${days} days`
  const conversion = t.referred_users > 0 ? Math.round((t.verified_referrals / t.referred_users) * 100) : 0

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3"><Gift className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Referrals</h1>
            <p className="text-sm text-muted-foreground">
              Invite codes from member cards. Rewards are paid when the referred user is verified.
            </p>
          </div>
        </div>
        <div className="flex gap-1 rounded-sm border bg-muted/20 p-1 w-fit">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => changeRange(r.days)} disabled={loading}
              className={cn("px-4 py-2 text-sm font-bold transition-all rounded-sm",
                days === r.days ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-5 transition-opacity", loading && "opacity-50")}>
        <StatTile icon={KeyRound} label="Codes issued" value={t.codes_issued} hint="All time" />
        <StatTile icon={UserPlus} label="Joined via code" value={t.referred_users} hint={`${t.referred_in_window.toLocaleString()} in ${windowLabel}`} />
        <StatTile icon={BadgeCheck} label="Verified" value={t.verified_referrals} hint={`${conversion}% conversion · ${t.verified_in_window.toLocaleString()} in ${windowLabel}`} />
        <StatTile icon={Hourglass} label="Awaiting verification" value={t.pending_referrals} />
        <StatTile icon={Coins} label="Points paid" value={t.points_paid} hint="Referrer + referee, all time" />
      </div>

      <div className={cn("grid gap-6 xl:grid-cols-2 transition-opacity", loading && "opacity-50")}>
        <Card>
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Trophy className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-bold">Top referrers</h2>
            <span className="text-xs text-muted-foreground">· sign-ups in {windowLabel}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className={cn(th, "w-10")}>#</th>
                  <th className={th}>User</th>
                  <th className={th}>Code</th>
                  <th className={cn(th, "text-right")}>Joined</th>
                  <th className={cn(th, "text-right pr-6")}>Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.leaderboard.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-16 text-center text-muted-foreground italic">No referrals in this period.</td></tr>
                ) : stats.leaderboard.map((e, i) => (
                  <tr key={e.user_id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-bold text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3 min-w-0">
                      <p className="font-bold truncate">{e.first_name} {e.last_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{e.university_name || e.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{e.referral_code}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{e.invited}</td>
                    <td className="px-4 py-3 text-right pr-6 font-bold text-success tabular-nums">{e.verified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <UserPlus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Recent referrals</h2>
            <span className="text-xs text-muted-foreground">· latest 50</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className={th}>New user</th>
                  <th className={th}>Referred by</th>
                  <th className={th}>Joined</th>
                  <th className={cn(th, "pr-6")}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recent.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-16 text-center text-muted-foreground italic">No referrals yet.</td></tr>
                ) : stats.recent.map(r => (
                  <tr key={r.referee_id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 min-w-0">
                      <p className="font-bold truncate">{r.referee_first_name} {r.referee_last_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.referee_email}</p>
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <p className="truncate">{r.referrer_first_name} {r.referrer_last_name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{r.referrer_code}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.joined_at).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 pr-6">
                      {r.rewarded_at ? (
                        <span className="inline-flex items-center rounded-full bg-success-subtle px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-success">Verified</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-warning-subtle px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-warning">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
