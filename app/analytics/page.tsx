import AnalyticsClient from "./analytics-client"
import { api } from "@/lib/api"

export const metadata = {
  title: "Usage Analytics | Campus Assistant",
  description: "Understand resource usage, search quality, retention, and onboarding.",
}

export default async function AnalyticsPage() {
  const [universities, departments] = await Promise.all([
    api.universities.getAll("limit=100"),
    api.departments.getAll("limit=100"),
  ])

  return <AnalyticsClient universities={universities} departments={departments} />
}
