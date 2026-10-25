// Query params the Users page understands, shared by the server page (which
// forwards them to the backend's /users) and the client filter panel.
// batch_id / session_id are resolved through the linked Student row on the
// backend; the rest are columns on users.
export const USER_FILTER_KEYS = [
  "role",
  "is_active",
  "is_verified",
  "plan_status",
  "gender",
  "university_id",
  "department_id",
  "session_id",
  "batch_id",
] as const

export type UserFilterKey = (typeof USER_FILTER_KEYS)[number]

// Shared between the filter panel and the edit-user modal.
export const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "staff", label: "Staff" },
  { value: "department_admin", label: "Department Admin" },
  { value: "university_admin", label: "University Admin" },
  { value: "super_admin", label: "Super Admin" },
] as const

export const GENDER_OPTIONS = ["Male", "Female"] as const
