"use client"

import { Department, University } from "@/lib/api"
import { Badge } from "./SharedUI"
import { Info, Building2, CalendarDays, ExternalLink, Mail, Phone, MapPin, Share2, Globe, Pencil, Layers } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AboutTabProps {
  department: Department
  university?: University | null
}

export function AboutTab({ department, university }: AboutTabProps) {
  const stats = [
    { label: "Established", value: department.established_year || "N/A", icon: CalendarDays },
    { label: "Acronym", value: department.acronym, icon: Building2 },
    { label: "Faculty", value: department.faculty?.name || "Unassigned", icon: Layers },
    { label: "Website", value: department.website_url ? "Available" : "Not Set", icon: Globe },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border rounded-sm p-4 flex items-center gap-4 shadow-xs transition-all hover:shadow-md">
            <div className="rounded-full bg-primary/5 p-2.5"><s.icon className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold text-sm tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card border rounded-sm p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <span className="h-6 w-1 bg-primary rounded-full hidden sm:block" />
                Department Biography
              </h4>
              {university && (
                <Link 
                  href={`/universities/${university.id}/departments/${department.id}/edit`}
                  className="flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter hover:bg-muted transition-all"
                >
                  <Pencil className="h-3 w-3" /> Edit Profile
                </Link>
              )}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              {department.about || "No information available yet."}
            </div>
          </section>

          {(department.website_url || (university && university.address)) && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {department.website_url && (
                <div className="bg-card border rounded-sm p-5 shadow-xs group">
                  <h5 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Web Presence
                  </h5>
                  <div className="space-y-3">
                    <a 
                      href={department.website_url.startsWith('http') ? department.website_url : `https://${department.website_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      {department.website_url} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              {university && university.address && (
                <div className="bg-card border rounded-sm p-5 shadow-xs">
                  <h5 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Campus Location
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">{university.address}</p>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-card border rounded-sm p-6 shadow-xs">
            <h4 className="text-sm font-bold mb-4">Actions</h4>
            <div className="space-y-2">
              {university && (
                <Link 
                  href={`/universities/${university.id}/departments/${department.id}/edit`}
                  className="w-full flex items-center justify-between p-3 rounded-sm border hover:bg-muted text-xs font-semibold transition-all"
                >
                  Edit Department <Pencil className="h-4 w-4" />
                </Link>
              )}
              <button 
                onClick={() => {
                  navigator.share?.({
                    title: department.name,
                    text: department.about,
                    url: window.location.href
                  }).catch(() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  });
                }}
                className="w-full flex items-center justify-between p-3 rounded-sm border hover:bg-muted text-xs font-semibold transition-all"
              >
                Share Department <Share2 className="h-4 w-4" />
              </button>
              {department.website_url && (
                <a 
                  href={department.website_url.startsWith('http') ? department.website_url : `https://${department.website_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-sm border hover:bg-muted text-xs font-semibold transition-all text-primary"
                >
                  Visit Official Site <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </section>
          
          {university && (
            <div className="p-1 rounded-sm border border-primary/20 bg-primary/5 text-center py-6">
              <Building2 className="mx-auto h-8 w-8 text-primary mb-2 opacity-80" />
              <p className="text-xs font-bold text-primary px-4 tracking-tight">{university.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
