function getEnv(name: string, fallback?: string): string {
  const val = process.env[name] || fallback;
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export function getApiKey(): string {
  return getEnv('NEXT_PUBLIC_API_KEY');
}

export function getApiUrl(): string {
  return getEnv('NEXT_PUBLIC_API_URL', 'http://localhost:8080/api/v1');
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const url = `${getApiUrl()}${endpoint}`;
  
  const headers = {
    ...options.headers,
    'X-API-Key': getApiKey(),
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  
  return response.json();
}

export function getFullImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith('http')) return url;
  const baseUrl = getApiUrl().replace('/api/v1', '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export interface University {
  id: string;
  name: string;
  acronym: string;
  slug: string;
  established_year: string;
  total_departments: string;
  total_faculties: string;
  total_halls: string;
  campus_area: string;
  about: string;
  address: string;
  latitude: number;
  longitude: number;
  website_url: string;
  logo_url: string;
  departments?: Department[];
  sessions?: Session[];
}

export interface Department {
  id: string;
  name: string;
  acronym: string;
  slug: string;
  established_year: number;
  about: string;
  website_url: string;
  logo_url: string;
  university_id: string;
}

export interface Hall {
  id: string;
  name: string;
  slug: string;
  university_id: string;
}

export interface Session {
  id: string;
  name: string;
  slug: string;
  university_id: string;
  department_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Batch {
  id: string;
  name: string;
  slug: string;
  is_studying: boolean;
  department_id: string;
  university_id: string;
  sessions?: Session[];
  created_at: string;
}

export interface Student {
  session?: Session;
  id: string;
  student_id: string;
  name: string;
  email: string;
  phone: string;
  blood_group: string;
  is_regular: boolean;
  is_cr: boolean;
  verification_code: string;
  is_claimed: boolean;
  claimed_at?: string;
  batch_id: string;
  batch?: Batch;
  department_id: string;
  university_id: string;
  session_id: string;
  hall_id?: string;
  hall?: Hall;
  user_id?: string;
  user?: { id: string; first_name: string; last_name: string; email: string; image_url?: string };
  created_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  about: string;
  interests: string;
  phd: string;
  publications: string;
  is_chairman: boolean;
  is_present: boolean;
  weight: number;
  verification_code: string;
  is_claimed: boolean;
  department_id: string;
  university_id: string;
  user_id?: string;
  user?: { id: string; first_name: string; last_name: string; image_url?: string };
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  post: string;
  mobile: string;
  image_url: string;
  serial: number;
  verification_code: string;
  is_claimed: boolean;
  department_id: string;
  university_id: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
  created_at: string;
}

export interface Alumni {
  id: string;
  full_name: string;
  student_id?: string;
  email: string;
  phone: string;
  batch?: string;
  passing_year?: string;
  current_status: string;
  organization: string;
  organization_id?: string;
  organization_ref?: Organization;
  designation: string;
  location: string;
  bio: string;
  profile_image: string;
  social_links?: { facebook?: string; linkedin?: string; twitter?: string };
  created_by: string;
  university_id: string;
  department_id: string;
  student_profile_id?: string;
  student_profile?: Student;
  created_at: string;
}

export interface Semester {
  id: string;
  name: string;
  order: number;
  status: string;
  total_courses: number;
  total_credits: number;
  total_marks: number;
  department_id: string;
  university_id: string;
  batches?: Batch[];
  created_at: string;
}

export interface CourseCategory {
  id: string;
  name: string;
  order: number;
  department_id: string;
  university_id: string;
  created_at: string;
}

export interface CoursePrefix {
  id: string;
  prefix: string;
  description: string;
  department_id: string;
  university_id: string;
  created_at: string;
}

export interface Course {
  id: string;
  course_code: string;
  course_title: string;
  university_id: string;
  department_id: string;
  total_credits: number;
  total_marks: number;
  thumbnail_url: string;
  course_category_id?: string;
  course_category?: CourseCategory;
  semester_id?: string;
  semester?: Semester;
  batches?: Batch[];
  created_at: string;
}

export interface Chapter {
  id: string;
  course_code: string;
  chapter_no: number;
  chapter_title: string;
  department_id: string;
  university_id: string;
  batches?: Batch[];
  created_at: string;
}

export type ResourceType = 'note' | 'question' | 'book' | 'syllabus' | 'video'
export type ResourceStatus = 'published' | 'pending' | 'rejected' | 'draft'
export type ResourceAccessLevel = 'basic' | 'pro'

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  course_code: string;
  file_url: string;
  thumbnail_url: string;
  lesson_no: number;
  status: ResourceStatus;
  access_level: ResourceAccessLevel;
  uploader_name: string;
  department_id: string;
  university_id: string;
  file_size_bytes: number;
  page_count: number;
  download_count: number;
  view_count: number;
  rating_avg: number;
  tags: string[];
  is_public: boolean;
  metadata?: Record<string, unknown>;
  batches?: Batch[];
  created_at: string;
}

export interface CR {
  id: string;
  name: string;
  student_id: string;
  email: string;
  phone: string;
  batch_id: string;
  batch: string;
  fb: string;
  image_url: string;
  is_current: boolean;
  term_start?: string;
  term_end?: string;
  department_id: string;
  university_id: string;
  created_at: string;
}

export interface Routine {
  id: string;
  title: string;
  image_url: string;
  time: string;
  university_id: string;
  department_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transport {
  id: string;
  title: string;
  image: string;
  time: string;
  university_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  click_url: string;
  priority: number;
  is_active: boolean;
  start_at: string;
  end_at: string;
  target_scope: string;
  targets?: { id: number; banner_id: string; university_id?: string; department_id?: string }[];
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  title: string;
  designation: string;
  description: string;
  phone: string;
  email: string;
  category: string;
  target_scope: string;
  targets?: { id: number; university_id?: string; department_id?: string }[];
  is_verified: boolean;
  logo_url: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: number;
  discount: number;
  duration_days: number;
  index: number;
  targets: SubscriptionTarget[];
}

export interface SubscriptionTarget {
  id?: string;
  plan_id?: string;
  university_id: string;
  department_id: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  user?: User;
  plan: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  limit: number;
  offset: number;
}

export interface User {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  avatar_url: string;
  is_active: boolean;
  is_verified: boolean;
  university_id?: string;
  university?: University;
  department_id?: string;
  department?: Department;
  student?: Student;
  teacher?: Teacher;
  created_at: string;
}

export interface DashboardStats {
  total_users: number;
  active_banners: number;
  total_subscriptions: number;
  total_revenue: number;
  user_trend: string;
  banner_trend: string;
  sub_trend: string;
  revenue_trend: string;
}

export const api = {
  fetchWithAuth,
  stats: {
    getDashboard: (): Promise<DashboardStats> =>
      fetchWithAuth('/stats'),
  },
  users: {
    getAll: (search?: string): Promise<User[]> => {
      const url = `/users?${search ? `search=${encodeURIComponent(search)}` : ''}`
      return fetchWithAuth(url).then((res: PaginatedResponse<User>) => res.data ?? [])
    },
    getOne: (id: string): Promise<User> =>
      fetchWithAuth(`/users/${id}`),
    create: (data: Partial<User>) => fetchWithAuth('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<User>) => fetchWithAuth(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchWithAuth(`/users/${id}`, {
      method: 'DELETE',
    }),
  },
  universities: {
    getAll: (params?: string): Promise<University[]> =>
      fetchWithAuth(`/universities?${params || ''}`).then((res: PaginatedResponse<University>) => res.data ?? []),
    getOne: (id: string, includeDetails: boolean = false) => 
      fetchWithAuth(`/universities/${id}${includeDetails ? '?include_details=true' : ''}`),
    getBySlug: (slug: string): Promise<University | null> =>
      fetchWithAuth(`/universities?slug=${slug}`).then((res: PaginatedResponse<University>) => 
        res.data && res.data.length > 0 ? res.data[0] : null
      ),
    create: (data: Partial<University>) => fetchWithAuth('/universities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<University>) => fetchWithAuth(`/universities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchWithAuth(`/universities/${id}`, {
      method: 'DELETE',
    }),
  },
  departments: {
    getAll: (params?: string): Promise<Department[]> =>
      fetchWithAuth(`/departments?${params || ''}`).then((res: PaginatedResponse<Department>) => res.data ?? []),
    getAllByUniversity: (universityId: string): Promise<Department[]> =>
      fetchWithAuth(`/departments?university_id=${universityId}`).then((res: PaginatedResponse<Department>) => res.data ?? []),
    getOne: (id: string): Promise<Department> =>
      fetchWithAuth(`/departments/${id}`),
    getBySlug: (slug: string): Promise<Department | null> =>
      fetchWithAuth(`/departments?slug=${slug}`).then((res: PaginatedResponse<Department>) => res.data?.[0] || null),
    create: (data: Partial<Department>) => fetchWithAuth('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Department>) => fetchWithAuth(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchWithAuth(`/departments/${id}`, {
      method: 'DELETE',
    }),
  },
  halls: {
    getAllByUniversity: (universityId: string): Promise<Hall[]> =>
      fetchWithAuth(`/halls?university_id=${universityId}`).then((res: PaginatedResponse<Hall>) => res.data ?? []),
    create: (data: Partial<Hall>): Promise<Hall> =>
      fetchWithAuth('/halls', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Hall>): Promise<Hall> =>
      fetchWithAuth(`/halls/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/halls/${id}`, { method: 'DELETE' }),
  },
  sessions: {
    getAll: (params?: string): Promise<Session[]> =>
      fetchWithAuth(`/sessions?${params || ''}`).then((res: PaginatedResponse<Session>) => res.data ?? []),
    getAllByDepartment: (deptId: string): Promise<Session[]> =>
      fetchWithAuth(`/sessions?department_id=${deptId}`).then((res: PaginatedResponse<Session>) => res.data ?? []),
    getAllByUniversity: (uniId: string): Promise<Session[]> =>
      fetchWithAuth(`/sessions?university_id=${uniId}`).then((res: PaginatedResponse<Session>) => res.data ?? []),
    create: (data: Partial<Session>): Promise<Session> =>
      fetchWithAuth('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Session>): Promise<Session> =>
      fetchWithAuth(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/sessions/${id}`, { method: 'DELETE' }),
  },
  batches: {
    getAll: (params?: string): Promise<Batch[]> =>
      fetchWithAuth(`/batches?${params || ''}`).then((res: PaginatedResponse<Batch>) => res.data ?? []),
    getAllByDepartment: (deptId: string): Promise<Batch[]> =>
      fetchWithAuth(`/batches?department_id=${deptId}`).then((res: PaginatedResponse<Batch>) => res.data ?? []),
    create: (data: Partial<Batch> & { session_ids?: string[] }): Promise<Batch> =>
      fetchWithAuth('/batches', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Batch> & { session_ids?: string[] }): Promise<Batch> =>
      fetchWithAuth(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/batches/${id}`, { method: 'DELETE' }),
  },
  teachers: {
    getAll: (params?: string): Promise<Teacher[]> =>
      fetchWithAuth(`/teachers?limit=1000&${params || ''}`).then((res: PaginatedResponse<Teacher>) => res.data ?? []),
    getAllByDepartment: (deptId: string): Promise<Teacher[]> =>
      fetchWithAuth(`/teachers?department_id=${deptId}`).then((res: PaginatedResponse<Teacher>) => res.data ?? []),
    create: (data: Partial<Teacher>): Promise<Teacher> =>
      fetchWithAuth('/teachers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Teacher>): Promise<Teacher> =>
      fetchWithAuth(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/teachers/${id}`, { method: 'DELETE' }),
  },
  staffs: {
    getAllByDepartment: (deptId: string): Promise<Staff[]> =>
      fetchWithAuth(`/staffs?department_id=${deptId}`).then((res: PaginatedResponse<Staff>) => res.data ?? []),
    create: (data: Partial<Staff>): Promise<Staff> =>
      fetchWithAuth('/staffs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Staff>): Promise<Staff> =>
      fetchWithAuth(`/staffs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/staffs/${id}`, { method: 'DELETE' }),
  },
  crs: {
    getAllByDepartment: (deptId: string): Promise<CR[]> =>
      fetchWithAuth(`/crs?department_id=${deptId}`).then((res: PaginatedResponse<CR>) => res.data ?? []),
    create: (data: Partial<CR>): Promise<CR> =>
      fetchWithAuth('/crs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CR>): Promise<CR> =>
      fetchWithAuth(`/crs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/crs/${id}`, { method: 'DELETE' }),
  },
  students: {
    getAll: (params?: string): Promise<Student[]> =>
      fetchWithAuth(`/students?limit=1000&${params || ''}`).then((res: PaginatedResponse<Student>) => res.data ?? []),
    getAllByDepartment: (deptId: string): Promise<Student[]> =>
      fetchWithAuth(`/students?department_id=${deptId}`).then((res: PaginatedResponse<Student>) => res.data ?? []),
    getAllByBatch: (batchId: string): Promise<Student[]> =>
      fetchWithAuth(`/students?batch_id=${batchId}`).then((res: PaginatedResponse<Student>) => res.data ?? []),
    create: (data: Partial<Student>): Promise<Student> =>
      fetchWithAuth('/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Student>): Promise<Student> =>
      fetchWithAuth(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/students/${id}`, { method: 'DELETE' }),
  },
  semesters: {
    getAllByDepartment: (deptId: string): Promise<Semester[]> =>
      fetchWithAuth(`/semesters?department_id=${deptId}`).then((res: PaginatedResponse<Semester>) => res.data ?? []),
    create: (data: Partial<Semester>): Promise<Semester> =>
      fetchWithAuth('/semesters', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Semester>): Promise<Semester> =>
      fetchWithAuth(`/semesters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/semesters/${id}`, { method: 'DELETE' }),
  },
  courses: {
    getAllByDepartment: (deptId: string): Promise<Course[]> =>
      fetchWithAuth(`/courses?department_id=${deptId}&limit=500`).then((res: PaginatedResponse<Course>) => res.data ?? []),
    getAllBySemester: (semesterId: string): Promise<Course[]> =>
      fetchWithAuth(`/courses?semester_id=${semesterId}&limit=500`).then((res: PaginatedResponse<Course>) => res.data ?? []),
    getOne: (id: string): Promise<Course> =>
      fetchWithAuth(`/courses/${id}`),
    create: (data: Partial<Course>): Promise<Course> =>
      fetchWithAuth('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Course>): Promise<Course> =>
      fetchWithAuth(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/courses/${id}`, { method: 'DELETE' }),
  },
  courseCategories: {
    getAllByDepartment: (deptId: string): Promise<CourseCategory[]> =>
      fetchWithAuth(`/course-categories?department_id=${deptId}`).then((res: PaginatedResponse<CourseCategory>) => res.data ?? []),
    create: (data: Partial<CourseCategory>): Promise<CourseCategory> =>
      fetchWithAuth('/course-categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CourseCategory>): Promise<CourseCategory> =>
      fetchWithAuth(`/course-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/course-categories/${id}`, { method: 'DELETE' }),
  },
  coursePrefixes: {
    getAllByDepartment: (deptId: string): Promise<CoursePrefix[]> =>
      fetchWithAuth(`/course-prefixes?department_id=${deptId}`).then((res: PaginatedResponse<CoursePrefix>) => res.data ?? []),
    create: (data: Partial<CoursePrefix>): Promise<CoursePrefix> =>
      fetchWithAuth('/course-prefixes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CoursePrefix>): Promise<CoursePrefix> =>
      fetchWithAuth(`/course-prefixes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/course-prefixes/${id}`, { method: 'DELETE' }),
  },
  chapters: {
    getAllByCourse: (courseCode: string): Promise<Chapter[]> =>
      fetchWithAuth(`/chapters?course_code=${encodeURIComponent(courseCode)}&limit=500`).then((res: PaginatedResponse<Chapter>) => res.data ?? []),
    create: (data: Partial<Chapter>): Promise<Chapter> =>
      fetchWithAuth('/chapters', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Chapter>): Promise<Chapter> =>
      fetchWithAuth(`/chapters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/chapters/${id}`, { method: 'DELETE' }),
  },
  resources: {
    getAllByCourse: (courseCode: string, type?: ResourceType, lessonNo?: number): Promise<Resource[]> =>
      fetchWithAuth(`/resources?course_code=${encodeURIComponent(courseCode)}${type ? `&type=${type}` : ''}${lessonNo ? `&lesson_no=${lessonNo}` : ''}&limit=500&status=published`).then((res: PaginatedResponse<Resource>) => res.data ?? []),
    create: (data: Partial<Resource>): Promise<Resource> =>
      fetchWithAuth('/resources', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Resource>): Promise<Resource> =>
      fetchWithAuth(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/resources/${id}`, { method: 'DELETE' }),
    approve: (id: string): Promise<Resource> =>
      fetchWithAuth(`/resources/${id}/approve`, { method: 'PATCH' }),
  },
  banners: {
    getAll: (scope?: string): Promise<Banner[]> =>
      fetchWithAuth(`/banners${scope ? `?target_scope=${scope}` : ''}`).then((res: PaginatedResponse<Banner>) => res.data ?? []),
    getAllByUniversity: (uniId: string): Promise<Banner[]> =>
      fetchWithAuth(`/banners?university_id=${uniId}`).then((res: PaginatedResponse<Banner>) => res.data ?? []),
    getAllByDepartment: (deptId: string): Promise<Banner[]> =>
      fetchWithAuth(`/banners?department_id=${deptId}`).then((res: PaginatedResponse<Banner>) => res.data ?? []),
    getOne: (id: string): Promise<Banner> =>
      fetchWithAuth(`/banners/${id}`),
    create: (data: Partial<Banner>): Promise<Banner> =>
      fetchWithAuth('/banners', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Banner>): Promise<Banner> =>
      fetchWithAuth(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/banners/${id}`, { method: 'DELETE' }),
  },
  emergencyContacts: {
    getAll: (params?: string): Promise<EmergencyContact[]> =>
      fetchWithAuth(`/emergency-contacts?${params || ''}`).then((res: PaginatedResponse<EmergencyContact>) => res.data ?? []),
    getAllByUniversity: (uniId: string): Promise<EmergencyContact[]> =>
      fetchWithAuth(`/emergency-contacts?university_id=${uniId}&target_scope=University`).then((res: PaginatedResponse<EmergencyContact>) => res.data ?? []),
    getAllByDepartment: (uniId: string, deptId: string): Promise<EmergencyContact[]> =>
      fetchWithAuth(`/emergency-contacts?university_id=${uniId}&department_id=${deptId}&target_scope=Department`).then((res: PaginatedResponse<EmergencyContact>) => res.data ?? []),
    getOne: (id: string): Promise<EmergencyContact> =>
      fetchWithAuth(`/emergency-contacts/${id}`),
    create: (data: Partial<EmergencyContact>): Promise<EmergencyContact> =>
      fetchWithAuth('/emergency-contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<EmergencyContact>): Promise<EmergencyContact> =>
      fetchWithAuth(`/emergency-contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/emergency-contacts/${id}`, { method: 'DELETE' }),
  },
  subscriptions: {
    getAll: (params?: string): Promise<UserSubscription[]> =>
      fetchWithAuth(`/subscriptions?${params || ''}`).then((res: PaginatedResponse<UserSubscription>) => res.data ?? []),
    getPlans: (params?: string): Promise<SubscriptionPlan[]> =>
      fetchWithAuth(`/subscription-plans?${params || ''}`).then((res: PaginatedResponse<SubscriptionPlan>) => res.data ?? []),
    createPlan: (data: Partial<SubscriptionPlan>) =>
      fetchWithAuth('/subscription-plans', { method: 'POST', body: JSON.stringify(data) }),
    updatePlan: (id: string, data: Partial<SubscriptionPlan>) =>
      fetchWithAuth(`/subscription-plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePlan: (id: string) =>
      fetchWithAuth(`/subscription-plans/${id}`, { method: 'DELETE' }),
    create: (data: Partial<UserSubscription>) =>
      fetchWithAuth('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchWithAuth(`/subscriptions/${id}`, { method: 'DELETE' }),
  },
  alumni: {
    getAllByDepartment: (universityId: string, deptId: string): Promise<Alumni[]> =>
      fetchWithAuth(`/alumni?university_id=${universityId}&department_id=${deptId}&limit=200&preload=true`).then((res: PaginatedResponse<Alumni>) => res.data ?? []),
    create: (data: Partial<Alumni>): Promise<Alumni> =>
      fetchWithAuth('/alumni', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Alumni>): Promise<Alumni> =>
      fetchWithAuth(`/alumni/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/alumni/${id}`, { method: 'DELETE' }),
  },
  organizations: {
    getAll: (params?: string): Promise<Organization[]> =>
      fetchWithAuth(`/organizations?limit=1000&${params || ''}`).then((res: PaginatedResponse<Organization>) => res.data ?? []),
    create: (data: Partial<Organization>): Promise<Organization> =>
      fetchWithAuth('/organizations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Organization>): Promise<Organization> =>
      fetchWithAuth(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/organizations/${id}`, { method: 'DELETE' }),
  },
  routines: {
    getAllByDepartment: (universityId: string, deptId: string): Promise<Routine[]> =>
      fetchWithAuth(`/routines?university_id=${universityId}&department_id=${deptId}&limit=200`).then((res: PaginatedResponse<Routine>) => res.data ?? []),
    create: (data: Partial<Routine>): Promise<Routine> =>
      fetchWithAuth('/routines', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Routine>): Promise<Routine> =>
      fetchWithAuth(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/routines/${id}`, { method: 'DELETE' }),
  },
  transports: {
    getAllByUniversity: (universityId: string): Promise<Transport[]> =>
      fetchWithAuth(`/transports?university_id=${universityId}`).then((res: PaginatedResponse<Transport>) => res.data ?? []),
    create: (data: Partial<Transport>): Promise<Transport> =>
      fetchWithAuth('/transports', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Transport>): Promise<Transport> =>
      fetchWithAuth(`/transports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/transports/${id}`, { method: 'DELETE' }),
  },
};
