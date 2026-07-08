import { api } from "@/lib/api"
import ContactsClient from "./contacts-client"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  // ELITE: Server-side prefetching for instant data paint
  const params = new URLSearchParams()
  if (typeof resolvedParams.search === 'string') params.set('search', resolvedParams.search)
  if (typeof resolvedParams.target_scope === 'string') params.set('target_scope', resolvedParams.target_scope)
  
  // Set a large limit for the dashboard
  params.set('limit', '100')
  
  // Fetch contacts based on search/filter
  const contacts = await api.emergencyContacts.getAll(params.toString())

  return <ContactsClient initialContacts={contacts} />
}

export const dynamic = "force-dynamic"
