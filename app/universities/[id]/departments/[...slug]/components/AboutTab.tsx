"use client"

import { Department, University } from "@/lib/api"
import { Building2, CalendarDays, ExternalLink, MapPin, Share2, Globe, Pencil, Layers, GraduationCap, Home, Maximize, School, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AboutTabProps {
  department: Department
  university?: University | null
}

type Tone = "primary" | "success" | "warning" | "info"

const toneStyles: Record<Tone, { tile: string; icon: string }> = {
  primary: { tile: "bg-primary/10 text-primary", icon: "text-primary" },
  success: { tile: "bg-success-subtle text-success", icon: "text-success" },
  warning: { tile: "bg-warning-subtle text-warning", icon: "text-warning" },
  info: { tile: "bg-info-subtle text-info", icon: "text-info" },
}

const normalizeUrl = (url: string) => (url.startsWith("http") ? url : `https://${url}`)

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: React.ReactNode; icon: React.ElementType; tone: Tone }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", toneStyles[tone].tile)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-lg font-extrabold tracking-tight">{value}</p>
    </div>
  )
}

function CampusFact({ label, value, icon: Icon, tone }: { label: string; value: React.ReactNode; icon: React.ElementType; tone: Tone }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/60 p-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneStyles[tone].tile)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-bold">{value}</p>
      </div>
    </div>
  )
}

export function AboutTab({ department, university }: AboutTabProps) {
  const stats: { label: string; value: React.ReactNode; icon: React.ElementType; tone: Tone }[] = [
    { label: "Established", value: department.established_year || "N/A", icon: CalendarDays, tone: "primary" },
    { label: "Acronym", value: department.acronym || "N/A", icon: Building2, tone: "info" },
    { label: "Faculty", value: department.faculty?.name || "Unassigned", icon: Layers, tone: "warning" },
    { label: "Website", value: department.website_url ? "Available" : "Not Set", icon: Globe, tone: department.website_url ? "success" : "warning" },
  ]

  const share = () => {
    navigator.share?.({ title: department.name, text: department.about, url: window.location.href }).catch(() => {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-card p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border bg-card p-3 shadow-sm">
              {department.logo_url ? (
                <img src={department.logo_url} alt={department.name} className="h-full w-full object-contain" />
              ) : (
                <GraduationCap className="h-9 w-9 text-primary/40" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> Department
                </span>
                {department.faculty?.name && (
                  <span className="rounded-full border bg-card px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {department.faculty.name}
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">{department.name}</h2>
              {university && (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <School className="h-4 w-4 text-primary" /> {university.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {university && (
              <Link
                href={`/universities/${university.id}/departments/${department.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            )}
            <button
              onClick={share}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-xs font-bold transition-all hover:bg-muted"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            {department.website_url && (
              <a
                href={normalizeUrl(department.website_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-muted"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Website
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* About department */}
        <section className="rounded-2xl border bg-card p-6 shadow-xs lg:col-span-3">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <span className="h-6 w-1 rounded-full bg-primary" />
            About the Department
          </h4>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {department.about || "No information available yet."}
          </p>
          {department.website_url && (
            <a
              href={normalizeUrl(department.website_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
            >
              <Globe className="h-3.5 w-3.5" /> {department.website_url} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </section>

        {/* Campus details */}
        {university && (
          <section className="rounded-2xl border bg-card p-6 shadow-xs lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background p-1.5">
                {university.logo_url ? (
                  <img src={university.logo_url} alt={university.name} className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Campus</p>
                <Link href={`/universities/${university.id}`} className="block truncate text-base font-extrabold tracking-tight hover:text-primary">
                  {university.name}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CampusFact label="Established" value={university.established_year || "N/A"} icon={CalendarDays} tone="primary" />
              <CampusFact label="Area" value={university.campus_area || "N/A"} icon={Maximize} tone="info" />
              <CampusFact label="Faculties" value={university.total_faculties || "0"} icon={Layers} tone="warning" />
              <CampusFact label="Departments" value={university.total_departments || "0"} icon={GraduationCap} tone="success" />
              <div className="col-span-2">
                <CampusFact label="Residential Halls" value={university.total_halls || "0"} icon={Home} tone="primary" />
              </div>
            </div>

            {university.address && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {university.address}
              </div>
            )}

            {university.about && (
              <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-muted-foreground">{university.about}</p>
            )}

            {university.website_url && (
              <a
                href={normalizeUrl(university.website_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                Campus website <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
