"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Sparkles,
  Globe,
  Target,
  PlayCircle,
  Info,
} from "lucide-react"
import Link from "next/link"
import { Skill, getFullImageUrl } from "@/lib/api"
import { SkillVideoManager } from "@/components/SkillVideoManager"

type TabType = "about" | "videos"

interface SkillDetailClientProps {
  skill: Skill
}

export default function SkillDetailClient({ skill }: SkillDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get("tab") as TabType) || "about"
  )

  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab)
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set("tab", tab)
      router.replace(`?${newParams.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "about", label: "About", icon: Info },
    { id: "videos", label: "Videos", icon: PlayCircle },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/skills"
            className="rounded-full p-2 hover:bg-accent transition-colors border"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{skill.title}</h1>
            <p className="text-sm text-muted-foreground">
              {skill.is_published ? "Published" : "Draft"}
              {skill.targets.length === 0 ? " · Global" : ` · ${skill.targets.length} target${skill.targets.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        <Link
          href={`/skills/edit/${skill.id}`}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold hover:bg-accent transition-colors"
        >
          Edit Skill
        </Link>
      </div>

      {/* Hero */}
      <div className="relative h-48 w-full overflow-hidden rounded-xl bg-muted">
        {skill.thumbnail_url ? (
          <img
            src={getFullImageUrl(skill.thumbnail_url)}
            alt={skill.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center opacity-20">
            <Sparkles className="h-16 w-16" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase shadow-sm ${
            skill.is_published ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
          }`}>
            {skill.is_published ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-500">
        {activeTab === "about" && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-bold mb-4">Description</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {skill.description || "No description provided."}
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-bold mb-4">Targeting</h2>
                {skill.targets.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span>This skill is visible to all universities (global).</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      This skill is targeted to {skill.targets.length} universit{skill.targets.length === 1 ? "y" : "ies"}.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {skill.targets.map((t, i) => (
                        <div key={t.id || i} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                          <Target className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-xs font-medium">
                            {t.university_id}
                            {t.department_id ? ` / ${t.department_id}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Index: {skill.index}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{skill.videos?.length ?? 0} video{(skill.videos?.length ?? 0) === 1 ? "" : "s"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`inline-block h-2 w-2 rounded-full ${skill.is_published ? "bg-emerald-500" : "bg-slate-400"}`} />
                  <span>{skill.is_published ? "Published" : "Draft"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "videos" && (
          <SkillVideoManager skillId={skill.id} />
        )}
      </div>
    </div>
  )
}
