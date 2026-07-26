import { api } from "@/lib/api"
import AssociationDetailClient from "./association-detail-client"

type Props = {
  params: Promise<{ id: string }>
}

export default async function AssociationDetailPage({ params }: Props) {
  const { id } = await params
  const association = await api.associations.getById(id)

  if (!association) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center text-destructive">
        <p className="font-bold">Association not found</p>
      </div>
    )
  }

  return <AssociationDetailClient association={association} />
}
