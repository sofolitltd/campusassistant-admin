"use client"

import { useState } from "react"
import { Smartphone, ShieldAlert, TriangleAlert } from "lucide-react"

import { api, type AppConfig } from "@/lib/api"
import { cn } from "@/lib/utils"

const inputCls =
  "w-full rounded-sm border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"

export default function AppVersionClient({ initialConfig }: { initialConfig: AppConfig }) {
  const [minVersionCode, setMinVersionCode] = useState(String(initialConfig.min_supported_version_code))
  const [updateMessage, setUpdateMessage] = useState(initialConfig.update_message)
  const [playStoreUrl, setPlayStoreUrl] = useState(initialConfig.play_store_url)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    const parsed = Number(minVersionCode)
    if (!Number.isInteger(parsed) || parsed < 0) {
      setMessage({ type: "error", text: "Minimum version code must be a non-negative whole number." })
      return
    }

    if (parsed > initialConfig.min_supported_version_code) {
      const confirmed = window.confirm(
        `This will force-update every user below version code ${parsed}.\n\n` +
          `Confirm that a build with versionCode ${parsed} is already LIVE on the Play Store ` +
          `(release submitted, reviewed, and rolled out) before continuing — raising this number ` +
          `ahead of the live release locks out your entire user base.\n\n` +
          `Proceed?`
      )
      if (!confirmed) return
    }

    setSaving(true)
    try {
      await api.appConfig.update({
        min_supported_version_code: parsed,
        update_message: updateMessage,
        play_store_url: playStoreUrl,
      })
      setMessage({ type: "success", text: "App version settings updated." })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update app config" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 lg:mx-0">
      <div>
        <h1 className="text-xl font-bold tracking-tight">App Version</h1>
        <p className="text-sm text-muted-foreground">
          Control forced updates for the Android app. Only bump the minimum version code for a critical release —
          every other release stays optional.
        </p>
      </div>

      <div className="flex gap-3 rounded-sm border border-warning/30 bg-warning-subtle p-4 text-sm">
        <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
        <div className="space-y-1 text-warning">
          <p className="font-semibold">Before raising the minimum version code:</p>
          <p>
            Set this number to the versionCode of a build that is <strong>already live</strong> on the Play Store —
            never ahead of it. Order matters: publish the release, wait for it to go live, <em>then</em> raise this
            number here. If you raise it first, every user — including ones who can&apos;t get the new build yet —
            is immediately locked out with no way through.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="rounded-sm border bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          Force update
        </h2>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Minimum supported version code
            </label>
            <input
              type="number"
              min={0}
              value={minVersionCode}
              onChange={(e) => setMinVersionCode(e.target.value)}
              className={inputCls}
              placeholder="e.g. 23"
            />
            <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              Any installed build below this Android versionCode is forced to update before it can be used.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Update message</label>
            <textarea
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              className={cn(inputCls, "min-h-[80px] resize-y")}
              placeholder="Shown on the blocking update screen, e.g. why this update is required."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Play Store URL</label>
            <input
              type="url"
              value={playStoreUrl}
              onChange={(e) => setPlayStoreUrl(e.target.value)}
              className={inputCls}
              placeholder="https://play.google.com/store/apps/details?id=..."
            />
          </div>
        </div>

        {message && (
          <p className={cn("mt-3 text-sm", message.type === "success" ? "text-success" : "text-destructive")}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-sm bg-primary-gradient px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  )
}
