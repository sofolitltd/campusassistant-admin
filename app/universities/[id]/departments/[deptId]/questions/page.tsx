import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import DepartmentResourceList from "../_components/DepartmentResourceList"

type Props = {
  params: Promise<{ id: string; deptId: string }>
}

export default async function QuestionsPage({ params }: Props) {
  const { id: universityId, deptId: departmentId } = await params
  const backUrl = `/universities/${universityId}/departments/${departmentId}?tab=study`

  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    }>
      <DepartmentResourceList
        title="Question Bank"
        type="question"
        universityId={universityId}
        departmentId={departmentId}
        backUrl={backUrl}
      />
    </Suspense>
  )
}