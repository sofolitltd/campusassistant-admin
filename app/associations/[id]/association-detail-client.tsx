"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Landmark,
  Calendar,
  Heart,
  BadgeCheck,
  MapPin,
  Globe,
  Mail,
  Phone,
  BookOpen,
  Users,
  CalendarClock,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { api, Association, getFullImageUrl } from "@/lib/api"
import { AssociationMembersManager } from "@/components/AssociationMembersManager"
import { AssociationEventManager } from "@/components/AssociationEventManager"

type TabType = "about" | "members" | "events"

interface AssociationDetailClientProps {
  association: Association
}

export default function AssociationDetailClient({ association }: AssociationDetailClientProps) {
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
    { id: "members", label: "Members", icon: Users },
    { id: "events", label: "Events", icon: CalendarClock },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/associations"
            className="rounded-full p-2 hover:bg-accent transition-colors border"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{association.name}</h1>
            <p className="text-sm text-muted-foreground">
              {association.association_type === "sub_district"
                ? `${association.sub_district_name}, ${association.district_name}`
                : association.district_name}
              {association.category ? ` · ${association.category}` : ""}
            </p>
          </div>
        </div>
        <Link
          href={`/associations/edit/${association.id}`}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold hover:bg-accent transition-colors"
        >
          Edit Association
        </Link>
      </div>

      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-xl bg-muted">
        {association.banner_url ? (
          <img
            src={getFullImageUrl(association.banner_url)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center opacity-20">
            <Landmark className="h-16 w-16" />
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
            {/* Info card */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-bold mb-4">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {association.description || "No description provided."}
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-bold mb-4">Contact & Social</h2>
                <div className="space-y-3">
                  {association.contact_email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${association.contact_email}`} className="text-primary hover:underline">
                        {association.contact_email}
                      </a>
                    </div>
                  )}
                  {association.contact_phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{association.contact_phone}</span>
                    </div>
                  )}
                  {association.social_links?.facebook && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={association.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        Facebook <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {association.social_links?.instagram && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={association.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        Instagram <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {association.social_links?.linkedin && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={association.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        LinkedIn <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {!association.contact_email && !association.contact_phone && !association.social_links?.facebook && !association.social_links?.instagram && !association.social_links?.linkedin && (
                    <p className="text-sm text-muted-foreground">No contact information available.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {association.logo_url && (
                <div className="rounded-lg border bg-card p-4 flex justify-center">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-muted">
                    <img
                      src={getFullImageUrl(association.logo_url)}
                      alt={association.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {association.association_type === "sub_district"
                      ? `${association.sub_district_name}, ${association.district_name}`
                      : association.district_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{association.association_type.replace("_", " ")}</span>
                </div>
                {association.founded_year && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Founded {association.founded_year}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span>{association.followers_count ?? 0} followers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                  <span>{association.is_verified ? "Verified" : "Not verified"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      association.is_active ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{association.is_active ? "Active" : "Pending approval"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <AssociationMembersManager associationId={association.id} />
        )}

        {activeTab === "events" && (
          <AssociationEventManager associationId={association.id} />
        )}
      </div>
    </div>
  )
}
