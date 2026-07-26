"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Users,
  Calendar,
  Heart,
  BadgeCheck,
  MapPin,
  Globe,
  Mail,
  Phone,
  BookOpen,
  CalendarClock,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { Club, getFullImageUrl } from "@/lib/api"
import { ClubEventManager } from "@/components/ClubEventManager"

type TabType = "about" | "events"

interface ClubDetailClientProps {
  club: Club
}

export default function ClubDetailClient({ club }: ClubDetailClientProps) {
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
    { id: "about", label: "About", icon: BookOpen },
    { id: "events", label: "Events", icon: CalendarClock },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/clubs"
            className="rounded-full p-2 hover:bg-accent transition-colors border"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
            <p className="text-sm text-muted-foreground">
              {club.club_type === "university" ? "University Club" : "Department Club"}
              {club.category ? ` · ${club.category}` : ""}
            </p>
          </div>
        </div>
        <Link
          href={`/clubs/edit/${club.id}`}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold hover:bg-accent transition-colors"
        >
          Edit Club
        </Link>
      </div>

      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-xl bg-muted">
        {club.banner_url ? (
          <img
            src={getFullImageUrl(club.banner_url)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center opacity-20">
            <Users className="h-16 w-16" />
          </div>
        )}
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
                <h2 className="text-lg font-bold mb-4">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {club.description || "No description provided."}
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-bold mb-4">Contact & Social</h2>
                <div className="space-y-3">
                  {club.contact_email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${club.contact_email}`} className="text-primary hover:underline">
                        {club.contact_email}
                      </a>
                    </div>
                  )}
                  {club.contact_phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{club.contact_phone}</span>
                    </div>
                  )}
                  {club.social_links?.facebook && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={club.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        Facebook <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {club.social_links?.instagram && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={club.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        Instagram <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {club.social_links?.linkedin && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={club.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        LinkedIn <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {!club.contact_email && !club.contact_phone && !club.social_links?.facebook && !club.social_links?.instagram && !club.social_links?.linkedin && (
                    <p className="text-sm text-muted-foreground">No contact information available.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {club.logo_url && (
                <div className="rounded-lg border bg-card p-4 flex justify-center">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-muted">
                    <img
                      src={getFullImageUrl(club.logo_url)}
                      alt={club.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{club.club_type === "university" ? "University Club" : "Department Club"}</span>
                </div>
                {club.founded_year && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Founded {club.founded_year}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span>{club.followers_count ?? 0} followers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                  <span>{club.is_verified ? "Verified" : "Not verified"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      club.is_active ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{club.is_active ? "Active" : "Pending approval"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <ClubEventManager clubId={club.id} />
        )}
      </div>
    </div>
  )
}
