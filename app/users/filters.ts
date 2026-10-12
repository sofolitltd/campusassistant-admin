// Query params the Users page understands, shared by the server page (which
// forwards them to the backend's /users) and the client filter panel.
// batch_id / session_id are resolved through the linked Student row on the
// backend; the rest are columns on users.
export const USER_FILTER_KEYS = [
  "role",
  "is_active",
  "is_verified",
  "is_pro",
  "gender",
  "university_id",
  "department_id",
  "session_id",
  "batch_id",
] as const

export type UserFilterKey = (typeof USER_FILTER_KEYS)[number]
