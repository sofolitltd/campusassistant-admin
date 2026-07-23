"use client"

import { useState } from "react"
import {
  Plus,
  Sparkles,
  MoreVertical,
  Trash2,
  Pencil,
  Globe,
  Target,
  PlayCircle
} from "lucide-react"
import Link from "next/link"
import { api, Skill, getFullImageUrl } from "@/lib/api"
import { ConfirmDelete } from "../universities/[id]/departments/[...slug]/components/SharedUI"

interface SkillsClientProps {
  initialSkills: Skill[]
}

export default function SkillsClient({ initialSkills }: SkillsClientProps) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await api.skills.delete(deleteId)
      setSkills(prev => prev.filter(s => s.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert("Failed to delete skill")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
          <p className="text-muted-foreground text-sm">Manage the &quot;Skill Up&quot; home-page catalog and its YouTube videos.</p>
        </div>
        <Link
          href="/skills/add"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all active:scale-95 w-max whitespace-nowrap flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Skill
        </Link>
      </div>

      {skills.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">No skills found</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-medium">
            Create your first skill and add YouTube videos to it.
          </p>
          <Link href="/skills/add" className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm">
            <Plus className="h-4 w-4" /> Create First Skill
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {skills.map((skill) => (
            <div key={skill.id} className="group overflow-hidden rounded-lg border bg-card shadow-xs transition-all hover:shadow-md border-border/60 relative">
              <Link href={`/skills/${skill.id}`} className="block">
                <div className="relative h-36 w-full overflow-hidden bg-muted">
                  {skill.thumbnail_url ? (
                    <img
                      src={getFullImageUrl(skill.thumbnail_url)}
                      alt={skill.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center opacity-20">
                      <Sparkles className="h-10 w-10" />
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shadow-sm ${
                      skill.is_published ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                    }`}>
                      {skill.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm h-10 line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={skill.title}>
                        {skill.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5">
                        {skill.targets.length === 0 ? (
                          <>
                            <Globe className="h-3 w-3 text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Global</span>
                          </>
                        ) : (
                          <>
                            <Target className="h-3 w-3 text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                              {skill.targets.length} target{skill.targets.length === 1 ? "" : "s"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-dashed pt-3 border-border/60">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                      <PlayCircle className="h-3 w-3" />
                      <span>{skill.videos?.length ?? 0} video{(skill.videos?.length ?? 0) === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="absolute top-2 right-12">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenu(activeMenu === skill.id ? null : skill.id) }}
                  className="rounded-full p-1.5 hover:bg-accent transition-colors bg-background/80 backdrop-blur-sm"
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>

                {activeMenu === skill.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                    <div className="absolute right-0 top-8 w-32 rounded-md border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100">
                      <Link
                        href={`/skills/edit/${skill.id}`}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-semibold hover:bg-accent transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button
                        onClick={() => { setDeleteId(skill.id); setActiveMenu(null) }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          <Link
            href="/skills/add"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted p-6 text-muted-foreground hover:border-primary hover:text-primary transition-all bg-muted/5 hover:bg-primary/5 group"
          >
            <div className="rounded-full bg-muted p-2.5 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Add Skill</span>
          </Link>
        </div>
      )}

      <ConfirmDelete
        open={!!deleteId}
        label="skill"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
