"use client"

import { useState } from "react"
import { FileText, Briefcase, Bell } from "lucide-react"
import { EmptyState } from "./SharedUI"

type SubTab = "circular" | "my-jobs" | "reminders"

export function CareerTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("circular")

  const subTabs: { id: SubTab; label: string }[] = [
    { id: "circular", label: "Circular" },
    { id: "my-jobs", label: "My Jobs" },
    { id: "reminders", label: "Reminders" },
  ]

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex border-b overflow-x-auto scrollbar-hide">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeSubTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8">
        {activeSubTab === "circular" && (
          <EmptyState icon={FileText} label="career circulars" />
        )}
        {activeSubTab === "my-jobs" && (
          <EmptyState icon={Briefcase} label="jobs" />
        )}
        {activeSubTab === "reminders" && (
          <EmptyState icon={Bell} label="reminders" />
        )}
      </div>
    </div>
  )
}
