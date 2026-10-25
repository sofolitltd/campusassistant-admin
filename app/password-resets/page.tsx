import { api } from "@/lib/api"
import PasswordResetsClient from "./password-resets-client"

// History of "forgot password" requests + the fresh-code issuance for users
// whose reset email never arrived (backend: GET/POST /admin/password-resets).
export default async function PasswordResetsPage() {
  const first = await api.passwordResets.getAll("page=1&pageSize=20")

  return (
    <PasswordResetsClient
      initialResets={first.resets}
      initialTotal={first.total}
      pageSize={first.pageSize || 20}
    />
  )
}

export const dynamic = "force-dynamic"
