function requireEnv(key: string, value: string | undefined, fallback?: string): string {
  const val = value || fallback;
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export function getApiKey(): string {
  return requireEnv('NEXT_PUBLIC_API_KEY', process.env.NEXT_PUBLIC_API_KEY);
}

export function getApiUrl(): string {
  return requireEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL, 'http://localhost:8080/api/v1');
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
    throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
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
  faculty_id?: string | null;
  faculty?: Faculty;
}

export interface Hall {
  id: string;
  name: string;
  slug: string;
  university_id: string;
}

export interface Faculty {
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
  weight: number;
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
  user?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string };
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
  user?: { id: string; first_name: string; last_name: string; avatar_url?: string };
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

export interface Level {
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
  level_id?: string;
  level?: Level;
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

export type ResourceType = 'note' | 'question' | 'book' | 'syllabus' | 'video' | 'research'
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

export interface Notice {
  id: string;
  uploader: string;
  message: string;
  image_urls: string[];
  university_id: string;
  department_id: string;
  created_at: string;
}

export interface Contributor {
  id: string;
  name: string;
  image_url: string;
  tier: string;
  university_id: string;
  university_name: string;
  department_id: string;
  department_name: string;
  session: string;
  student_profile_id?: string;
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
  is_lifetime: boolean;
  index: number;
  targets: SubscriptionTarget[];
}

export interface SubscriptionTarget {
  id?: string;
  plan_id?: string;
  university_id: string;
  department_id: string;
}

// SkillTarget links a Skill to a university/department. A Skill with zero
// targets is global (visible to everyone) — unlike SubscriptionTarget,
// this is optional, not required.
export interface SkillTarget {
  id?: string;
  skill_id?: string;
  university_id: string;
  department_id: string;
}

export interface SkillVideo {
  id: string;
  skill_id: string;
  youtube_url: string;
  title: string;
  thumbnail_url: string;
  duration: string;
  index: number;
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  index: number;
  is_published: boolean;
  targets: SkillTarget[];
  videos?: SkillVideo[];
}

export type MerchantStatus = 'pending' | 'approved' | 'rejected';

export interface Merchant {
  id: string;
  user_id: string;
  // Preloaded read-only — lets an admin cross-check the applicant's real
  // account identity against their uploaded ID proofs.
  user?: { id: string; email: string; first_name: string; last_name: string };
  business_name: string;
  description: string;
  logo_url: string;
  business_type?: string;
  // Contact-only fields — the app's public storefront lookup redacts these;
  // the admin panel (this API) always receives them in full.
  phone?: string;
  email?: string;
  commission_rate: number;
  status: MerchantStatus;
  is_platform: boolean;
  rejection_reason?: string;
  website?: string;
  social_media_link?: string;
  // Verification documents uploaded by the applicant — admin-only, use to
  // confirm identity before approving. These are attachment IDs (private
  // storage), not directly-loadable URLs — resolve via api.attachments.getUrl.
  student_id_proof_url?: string;
  nid_proof_url?: string;
  payout_method?: string;
  payout_account?: string;
  created_at: string;
}

// ProductTarget links a Product to a university/department. A Product with
// zero targets is global (visible to everyone), same shape as SkillTarget.
export interface ProductTarget {
  id?: string;
  product_id?: string;
  university_id: string;
  department_id: string;
}

export interface Product {
  id: string;
  merchant_id: string;
  merchant?: Merchant;
  title: string;
  description: string;
  price: number;
  stock: number;
  image_urls: string[];
  category_id?: string;
  category?: MarketplaceCategory;
  is_published: boolean;
  targets: ProductTarget[];
  created_at: string;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  product_id: string;
  product_title: string;
  merchant_id: string;
  quantity: number;
  unit_price: number;
  commission_rate_snapshot: number;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  shipping_recipient_name: string;
  shipping_phone: string;
  shipping_address_line: string;
  shipping_city: string;
  total_amount: number;
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  image_url: string;
  description: string;
  index: number;
  created_at: string;
}

export type LostFoundType = 'lost' | 'found';
export type LostFoundStatus = 'open' | 'claimed' | 'resolved' | 'removed';
export type LostFoundClaimStatus = 'pending' | 'accepted' | 'rejected';
export type LostFoundReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface LostFoundCategory {
  id: string;
  name: string;
  icon_key: string;
  index: number;
  created_at: string;
}

// LostFoundItemTarget links an item to a university/department. An item with
// zero targets is global (visible campus-wide), same shape as ProductTarget.
export interface LostFoundItemTarget {
  id?: string;
  item_id?: string;
  university_id: string;
  department_id: string;
}

export interface LostFoundUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface LostFoundItem {
  id: string;
  type: LostFoundType;
  title: string;
  description: string;
  category_id?: string;
  category?: LostFoundCategory;
  image_urls: string[];
  location: string;
  event_date?: string;
  status: LostFoundStatus;
  removal_reason?: string;
  resolved_at?: string;
  poster_id: string;
  poster?: LostFoundUser;
  targets: LostFoundItemTarget[];
  created_at: string;
}

export interface LostFoundClaim {
  id: string;
  item_id: string;
  claimer_id: string;
  claimer?: LostFoundUser;
  message: string;
  status: LostFoundClaimStatus;
  created_at: string;
}

export interface LostFoundReport {
  id: string;
  item_id: string;
  item?: LostFoundItem;
  reporter_id: string;
  reporter?: LostFoundUser;
  reason: string;
  status: LostFoundReportStatus;
  created_at: string;
}

export interface CareerCircularCategory {
  id: string;
  name: string;
  icon_key: string;
  index: number;
  created_at: string;
}

// CareerCircularTarget links a circular to a university/department. A
// circular with zero targets is global, same shape as ProductTarget.
export interface CareerCircularTarget {
  id?: string;
  circular_id?: string;
  university_id: string;
  department_id: string;
}

export interface CareerCircular {
  id: string;
  title: string;
  organization: string;
  category_id?: string;
  category?: CareerCircularCategory;
  description: string;
  attachment_urls: string[];
  post_link: string;
  resource_link: string;
  publish_date?: string;
  deadline_date?: string;
  views_count: number;
  is_published: boolean;
  targets: CareerCircularTarget[];
  created_at: string;
}

export type ClubType = 'department' | 'university';

export const CLUB_CATEGORIES = [
  'Academic',
  'Cultural',
  'Sports',
  'Technology',
  'Arts',
  'Social Service',
  'Debate',
  'Other',
] as const;
export type ClubCategory = typeof CLUB_CATEGORIES[number];

export interface Club {
  id: string;
  name: string;
  description: string;
  club_type: ClubType;
  university_id: string;
  department_id?: string | null;
  logo_url?: string;
  banner_url?: string;
  founded_year?: number;
  is_active: boolean;
  social_links?: { facebook?: string; instagram?: string; linkedin?: string };
  contact_email?: string;
  contact_phone?: string;
  followers_count: number;
  category?: string;
  is_verified: boolean;
  created_at: string;
}

export interface ClubEvent {
  id: string;
  club_id: string;
  title: string;
  description: string;
  image_url: string;
  location: string;
  start_at: string;
  end_at?: string;
  // Toggling this on at create time is what triggers the push notification
  // to the club's followers — see ClubEventManager for the confirmation UI.
  is_published: boolean;
  created_at: string;
}

export type AssociationType = 'district' | 'sub_district';

export const ASSOCIATION_CATEGORIES = [
  'Regional Welfare',
  'Cultural',
  'Sports',
  'Social Service',
  'Academic',
  'Networking',
  'Other',
] as const;
export type AssociationCategory = typeof ASSOCIATION_CATEGORIES[number];

export interface BDSubDistrict {
  id: string;
  name: string;
}

export interface BDDistrict {
  id: string;
  name: string;
  division?: string;
  sub_districts: BDSubDistrict[];
}

export interface Association {
  id: string;
  name: string;
  description: string;
  association_type: AssociationType;
  university_id: string;
  district_id: string;
  district_name: string;
  sub_district_id?: string | null;
  sub_district_name?: string | null;
  logo_url?: string;
  banner_url?: string;
  founded_year?: number;
  is_active: boolean;
  social_links?: { facebook?: string; instagram?: string; linkedin?: string };
  contact_email?: string;
  contact_phone?: string;
  followers_count: number;
  category?: string;
  is_verified: boolean;
  created_at: string;
}

export interface AssociationMemberSummary {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role?: string;
}

export interface AssociationEvent {
  id: string;
  association_id: string;
  title: string;
  description: string;
  image_url: string;
  location: string;
  start_at: string;
  end_at?: string;
  is_published: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  user?: User;
  plan: string;
  price: number;
  start_date: string;
  end_date: string | null; // null = Lifetime plan, never expires
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

export interface DailyCount {
  date: string;
  count: number;
}

export interface RecentSubscriber {
  user_id: string;
  name: string;
  plan: string;
  status: string;
  date: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  scope: string; // "user" | "batch" | "department" | "university"
  target_id?: string | null;
  image_url?: string;
  data: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  recipient_count: number;
  read_count: number;
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
  user_growth: DailyCount[];
  recent_subscriptions: RecentSubscriber[];
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
  faculties: {
    getAllByUniversity: (universityId: string): Promise<Faculty[]> =>
      fetchWithAuth(`/faculties?university_id=${universityId}`).then((res: PaginatedResponse<Faculty>) => res.data ?? []),
    create: (data: Partial<Faculty>): Promise<Faculty> =>
      fetchWithAuth('/faculties', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Faculty>): Promise<Faculty> =>
      fetchWithAuth(`/faculties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/faculties/${id}`, { method: 'DELETE' }),
  },
  skills: {
    getAll: (): Promise<Skill[]> =>
      fetchWithAuth('/skills').then((res: PaginatedResponse<Skill>) => res.data ?? []),
    getById: (id: string): Promise<Skill> =>
      fetchWithAuth(`/skills/${id}`),
    create: (data: Partial<Skill>): Promise<Skill> =>
      fetchWithAuth('/skills', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Skill>): Promise<Skill> =>
      fetchWithAuth(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/skills/${id}`, { method: 'DELETE' }),
  },
  skillVideos: {
    getBySkill: (skillId: string): Promise<SkillVideo[]> =>
      fetchWithAuth(`/skill-videos?skill_id=${skillId}`).then((res: PaginatedResponse<SkillVideo>) => res.data ?? []),
    create: (data: Partial<SkillVideo>): Promise<SkillVideo> =>
      fetchWithAuth('/skill-videos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<SkillVideo>): Promise<SkillVideo> =>
      fetchWithAuth(`/skill-videos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/skill-videos/${id}`, { method: 'DELETE' }),
  },
  merchants: {
    getAll: (status?: MerchantStatus): Promise<Merchant[]> =>
      fetchWithAuth(`/merchants${status ? `?status=${status}` : ''}`).then((res: PaginatedResponse<Merchant>) => res.data ?? []),
    getById: (id: string): Promise<Merchant> =>
      fetchWithAuth(`/merchants/${id}`),
    getPlatform: (): Promise<Merchant> =>
      fetchWithAuth('/merchants/platform'),
    update: (id: string, data: Partial<Merchant>): Promise<Merchant> =>
      fetchWithAuth(`/merchants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    approve: (id: string): Promise<void> =>
      fetchWithAuth(`/merchants/${id}/approve`, { method: 'PUT' }),
    reject: (id: string, reason?: string): Promise<void> =>
      fetchWithAuth(`/merchants/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/merchants/${id}`, { method: 'DELETE' }),
  },
  attachments: {
    // Resolves any attachment id to a viewing URL — a short-lived signed
    // URL for private documents (e.g. merchant verification photos), or
    // the permanent public URL otherwise. Never cache the returned URL.
    getUrl: (id: string): Promise<{ url: string; expires_in_seconds?: number }> =>
      fetchWithAuth(`/attachments/${id}/url`),
  },
  products: {
    getAll: (merchantId?: string): Promise<Product[]> =>
      fetchWithAuth(`/products${merchantId ? `?merchant_id=${merchantId}` : ''}`).then((res: PaginatedResponse<Product>) => res.data ?? []),
    getById: (id: string): Promise<Product> =>
      fetchWithAuth(`/products/${id}`),
    create: (data: Partial<Product>): Promise<Product> =>
      fetchWithAuth('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>): Promise<Product> =>
      fetchWithAuth(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/products/${id}`, { method: 'DELETE' }),
  },
  clubs: {
    getAll: (params?: string): Promise<Club[]> =>
      fetchWithAuth(`/clubs?limit=500&${params || ''}`).then((res: PaginatedResponse<Club>) => res.data ?? []),
    getById: (id: string): Promise<Club> =>
      fetchWithAuth(`/clubs/${id}`),
    create: (data: Partial<Club>): Promise<Club> =>
      fetchWithAuth('/clubs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Club>): Promise<Club> =>
      fetchWithAuth(`/clubs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/clubs/${id}`, { method: 'DELETE' }),
  },
  clubEvents: {
    getByClub: (clubId: string): Promise<ClubEvent[]> =>
      fetchWithAuth(`/club-events?club_id=${clubId}`).then((res: PaginatedResponse<ClubEvent>) => res.data ?? []),
    create: (data: Partial<ClubEvent>): Promise<ClubEvent> =>
      fetchWithAuth('/club-events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ClubEvent>): Promise<ClubEvent> =>
      fetchWithAuth(`/club-events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/club-events/${id}`, { method: 'DELETE' }),
  },
  bdDistricts: {
    getAll: (): Promise<BDDistrict[]> =>
      fetchWithAuth(`/bd-districts`),
  },
  associations: {
    getAll: (params?: string): Promise<Association[]> =>
      fetchWithAuth(`/associations?limit=500&${params || ''}`).then((res: PaginatedResponse<Association>) => res.data ?? []),
    getById: (id: string): Promise<Association> =>
      fetchWithAuth(`/associations/${id}`),
    create: (data: Partial<Association>): Promise<Association> =>
      fetchWithAuth('/associations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Association>): Promise<Association> =>
      fetchWithAuth(`/associations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/associations/${id}`, { method: 'DELETE' }),
    getPendingMembers: (id: string): Promise<AssociationMemberSummary[]> =>
      fetchWithAuth(`/associations/${id}/members/pending`),
    approveMember: (id: string, userId: string): Promise<void> =>
      fetchWithAuth(`/associations/${id}/members/${userId}/approve`, { method: 'POST' }),
    rejectMember: (id: string, userId: string): Promise<void> =>
      fetchWithAuth(`/associations/${id}/members/${userId}/reject`, { method: 'POST' }),
  },
  associationEvents: {
    getByAssociation: (associationId: string): Promise<AssociationEvent[]> =>
      fetchWithAuth(`/association-events?association_id=${associationId}`).then((res: PaginatedResponse<AssociationEvent>) => res.data ?? []),
    create: (data: Partial<AssociationEvent>): Promise<AssociationEvent> =>
      fetchWithAuth('/association-events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<AssociationEvent>): Promise<AssociationEvent> =>
      fetchWithAuth(`/association-events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/association-events/${id}`, { method: 'DELETE' }),
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
  levels: {
    getAllByDepartment: (deptId: string): Promise<Level[]> =>
      fetchWithAuth(`/levels?department_id=${deptId}`).then((res: PaginatedResponse<Level>) => res.data ?? []),
    create: (data: Partial<Level>): Promise<Level> =>
      fetchWithAuth('/levels', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Level>): Promise<Level> =>
      fetchWithAuth(`/levels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/levels/${id}`, { method: 'DELETE' }),
  },
  courses: {
    getAllByDepartment: (deptId: string): Promise<Course[]> =>
      fetchWithAuth(`/courses?department_id=${deptId}&limit=500`).then((res: PaginatedResponse<Course>) => res.data ?? []),
    getAllByLevel: (levelId: string): Promise<Course[]> =>
      fetchWithAuth(`/courses?level_id=${levelId}&limit=500`).then((res: PaginatedResponse<Course>) => res.data ?? []),
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
    getAllByDepartment: (departmentId: string, type?: ResourceType, search?: string, offset?: number, limit?: number): Promise<PaginatedResponse<Resource>> =>
      fetchWithAuth(`/resources?department_id=${departmentId}&limit=${limit ?? 20}&offset=${offset ?? 0}${type ? `&type=${type}` : ''}${search ? `&search=${search}` : ''}`),
    create: (data: Partial<Resource>): Promise<Resource> =>
      fetchWithAuth('/resources', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Resource>): Promise<Resource> =>
      fetchWithAuth(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/resources/${id}`, { method: 'DELETE' }),
    permanentDelete: (id: string): Promise<void> =>
      fetchWithAuth(`/resources/${id}?permanent=true`, { method: 'DELETE' }),
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
  notices: {
    getAllByDepartment: (deptId: string): Promise<Notice[]> =>
      fetchWithAuth(`/notices?department_id=${deptId}&limit=100`).then((res: PaginatedResponse<Notice>) => res.data ?? []),
    create: (data: Partial<Notice>): Promise<Notice> =>
      fetchWithAuth('/notices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Notice>): Promise<Notice> =>
      fetchWithAuth(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/notices/${id}`, { method: 'DELETE' }),
  },
  contributors: {
    getAll: (): Promise<Contributor[]> =>
      fetchWithAuth(`/contributors?limit=200`).then((res: PaginatedResponse<Contributor>) => res.data ?? []),
    getAllByDepartment: (deptId: string): Promise<Contributor[]> =>
      fetchWithAuth(`/contributors?department_id=${deptId}&limit=200`).then((res: PaginatedResponse<Contributor>) => res.data ?? []),
    create: (data: Partial<Contributor>): Promise<Contributor> =>
      fetchWithAuth('/contributors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Contributor>): Promise<Contributor> =>
      fetchWithAuth(`/contributors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/contributors/${id}`, { method: 'DELETE' }),
    hardDelete: (id: string): Promise<void> =>
      fetchWithAuth(`/contributors/${id}?permanent=true`, { method: 'DELETE' }),
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
    getAllPaginated: (offset?: number, limit?: number): Promise<PaginatedResponse<UserSubscription>> =>
      fetchWithAuth(`/subscriptions?offset=${offset ?? 0}&limit=${limit ?? 20}`),
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
  marketplaceCategories: {
    getAll: (params?: string): Promise<MarketplaceCategory[]> =>
      fetchWithAuth(`/marketplace-categories?${params || ''}`).then((res: PaginatedResponse<MarketplaceCategory>) => res.data ?? []),
    getById: (id: string): Promise<MarketplaceCategory> =>
      fetchWithAuth(`/marketplace-categories/${id}`),
    create: (data: Partial<MarketplaceCategory>): Promise<MarketplaceCategory> =>
      fetchWithAuth('/marketplace-categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<MarketplaceCategory>): Promise<MarketplaceCategory> =>
      fetchWithAuth(`/marketplace-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/marketplace-categories/${id}`, { method: 'DELETE' }),
  },
  orders: {
    getAll: (status?: string): Promise<Order[]> =>
      fetchWithAuth(`/orders${status ? `?status=${status}` : ''}`).then((res: PaginatedResponse<Order>) => res.data ?? []),
    getById: (id: string): Promise<Order> =>
      fetchWithAuth(`/orders/${id}`),
    updateStatus: (id: string, status: OrderStatus): Promise<void> =>
      fetchWithAuth(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  },
  lostFoundCategories: {
    getAll: (params?: string): Promise<LostFoundCategory[]> =>
      fetchWithAuth(`/lost-found-categories?${params || ''}`).then((res: PaginatedResponse<LostFoundCategory>) => res.data ?? []),
    getById: (id: string): Promise<LostFoundCategory> =>
      fetchWithAuth(`/lost-found-categories/${id}`),
    create: (data: Partial<LostFoundCategory>): Promise<LostFoundCategory> =>
      fetchWithAuth('/lost-found-categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<LostFoundCategory>): Promise<LostFoundCategory> =>
      fetchWithAuth(`/lost-found-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/lost-found-categories/${id}`, { method: 'DELETE' }),
  },
  lostFoundItems: {
    getAll: (params?: string): Promise<LostFoundItem[]> =>
      fetchWithAuth(`/lost-found-items?limit=200&${params || ''}`).then((res: PaginatedResponse<LostFoundItem>) => res.data ?? []),
    getById: (id: string): Promise<LostFoundItem> =>
      fetchWithAuth(`/lost-found-items/${id}`),
    updateStatus: (id: string, status: LostFoundStatus, removalReason?: string): Promise<void> =>
      fetchWithAuth(`/lost-found-items/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, removal_reason: removalReason }),
      }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/lost-found-items/${id}`, { method: 'DELETE' }),
  },
  lostFoundReports: {
    getAll: (status?: LostFoundReportStatus): Promise<LostFoundReport[]> =>
      fetchWithAuth(`/lost-found-reports${status ? `?status=${status}` : ''}`).then((res: PaginatedResponse<LostFoundReport>) => res.data ?? []),
    resolve: (id: string): Promise<void> =>
      fetchWithAuth(`/lost-found-reports/${id}/resolve`, { method: 'PUT', body: JSON.stringify({ status: 'resolved' }) }),
    dismiss: (id: string): Promise<void> =>
      fetchWithAuth(`/lost-found-reports/${id}/resolve`, { method: 'PUT', body: JSON.stringify({ status: 'dismissed' }) }),
  },
  careerCircularCategories: {
    getAll: (params?: string): Promise<CareerCircularCategory[]> =>
      fetchWithAuth(`/career-circular-categories?${params || ''}`).then((res: PaginatedResponse<CareerCircularCategory>) => res.data ?? []),
    getById: (id: string): Promise<CareerCircularCategory> =>
      fetchWithAuth(`/career-circular-categories/${id}`),
    create: (data: Partial<CareerCircularCategory>): Promise<CareerCircularCategory> =>
      fetchWithAuth('/career-circular-categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CareerCircularCategory>): Promise<CareerCircularCategory> =>
      fetchWithAuth(`/career-circular-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/career-circular-categories/${id}`, { method: 'DELETE' }),
  },
  careerCirculars: {
    getAll: (params?: string): Promise<CareerCircular[]> =>
      fetchWithAuth(`/career-circulars?limit=200&${params || ''}`).then((res: PaginatedResponse<CareerCircular>) => res.data ?? []),
    getById: (id: string): Promise<CareerCircular> =>
      fetchWithAuth(`/career-circulars/${id}`),
    create: (data: Partial<CareerCircular>): Promise<CareerCircular> =>
      fetchWithAuth('/career-circulars', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CareerCircular>): Promise<CareerCircular> =>
      fetchWithAuth(`/career-circulars/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      fetchWithAuth(`/career-circulars/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    getAll: (): Promise<AppNotification[]> =>
      fetchWithAuth(`/admin/notifications`),
    create: (data: Record<string, unknown>) =>
      fetchWithAuth('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchWithAuth(`/admin/notifications/${id}`, { method: 'DELETE' }),
  },
};
