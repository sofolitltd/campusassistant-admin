"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft, BookOpen, Pencil, Star, Award, BookMarked,
  Video, HelpCircle, FileText, Layers,
} from "lucide-react"
import { api, Course, Batch } from "@/lib/api"
import { cn } from "@/lib/utils"
import { CourseModal } from "../components/CourseModal"
import ChaptersTab from "./tabs/ChaptersTab"
import ResourcesTab from "./tabs/ResourcesTab"
import PlaceholderTab from "./tabs/PlaceholderTab"

const TABS = [
  { key: "chapters",  label: "Chapters",  Icon: BookMarked },
  { key: "videos",    label: "Videos",    Icon: Video      },
  { key: "books",     label: "Books",     Icon: Layers     },
  { key: "questions", label: "Questions", Icon: HelpCircle },
  { key: "syllabus",  label: "Syllabus",  Icon: FileText   },
] as const

type TabKey = (typeof TABS)[number]["key"]

interface Props {
  universityId: string
  departmentId: string
  semesterId: string
  semesterName: string
  courseId: string
  // Optimistic params from URL — overridden once we fetch the real data
  initialCourseCode: string
  initialCourseTitle: string
}

export default function CourseDetailClient({
  universityId, departmentId, semesterId, semesterName,
  courseId, initialCourseCode, initialCourseTitle,
}: Props) {
  const [course, setCourse] = useState<Course | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("chapters")
  const [editModal, setEditModal] = useState(false)

  // Supporting data for the edit modal
  const [categories, setCategories] = useState<any[]>([])
  const [prefixes, setPrefixes] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, bats, cats, prefs, sems] = await Promise.all([
        api.courses.getOne(courseId),
        api.batches.getAllByDepartment(departmentId),
        api.courseCategories.getAllByDepartment(departmentId),
        api.coursePrefixes.getAllByDepartment(departmentId),
        api.semesters.getAllByDepartment(departmentId),
      ])
      setCourse(c)
      setBatches(bats)
      setCategories(cats)
      setPrefixes(prefs)
      setSemesters(sems)
    } catch {
      // keep showing optimistic data from URL params
    } finally {
      setLoading(false)
    }
  }, [courseId, departmentId])

  useEffect(() => { load() }, [load])

  const courseCode  = course?.course_code  ?? initialCourseCode
  const courseTitle = course?.course_title ?? initialCourseTitle

  const backUrl = `/universities/${universityId}/departments/${departmentId}/courses/${semesterId}?semesterName=${encodeURIComponent(semesterName)}&deptSlug=${departmentId}`

  return (
    <div className="space-y-0 pb-32">
      {/* ── Hero header ── */}
      <div className="border-b bg-card">
        <div className="flex flex-col gap-4 px-0 pt-0 pb-0">

          {/* Breadcrumb + actions row */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
            <div className="flex items-center gap-4">
              <Link href={backUrl}
                className="rounded-full border p-2 hover:bg-accent transition-colors shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Link>

              {/* Thumbnail + title */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-12 shrink-0 rounded-sm border bg-muted/30 overflow-hidden flex items-center justify-center">
                  {course?.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={courseTitle}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                  ) : (
                    <BookOpen className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-black text-primary uppercase tracking-widest">{courseCode}</p>
                  <h1 className="text-xl font-black tracking-tight leading-tight">{courseTitle}</h1>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {course?.course_category?.name && (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary rounded-sm px-2 py-0.5">
                        {course.course_category.name}
                      </span>
                    )}
                    
                  </div>
                </div>
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setEditModal(true)}
              className="flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium hover:bg-muted transition-all shrink-0">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>

          {/* ── Tab bar ── */}
          <div className="flex gap-0 border-t overflow-x-auto scrollbar-none px-4">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 shrink-0 transition-all",
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="p-6">
        {activeTab === "chapters" && (
          <ChaptersTab
            courseCode={courseCode}
            universityId={universityId}
            departmentId={departmentId}
            semesterId={semesterId}
            courseId={courseId}
            batches={batches}
          />
        )}
        {activeTab === "videos" && (
          <ResourcesTab
            type="video"
            courseCode={courseCode}
            universityId={universityId}
            departmentId={departmentId}
            batches={batches}
          />
        )}
        {activeTab === "books" && (
          <ResourcesTab
            type="book"
            courseCode={courseCode}
            universityId={universityId}
            departmentId={departmentId}
            batches={batches}
          />
        )}
        {activeTab === "questions" && (
          <ResourcesTab
            type="question"
            courseCode={courseCode}
            universityId={universityId}
            departmentId={departmentId}
            batches={batches}
          />
        )}
        {activeTab === "syllabus" && (
          <ResourcesTab
            type="syllabus"
            courseCode={courseCode}
            universityId={universityId}
            departmentId={departmentId}
            batches={batches}
          />
        )}
      </div>

      {/* Edit course modal */}
      {course && (
        <CourseModal
          open={editModal}
          onClose={() => setEditModal(false)}
          universityId={universityId}
          departmentId={departmentId}
          semesterId={semesterId}
          course={course}
          categories={categories}
          prefixes={prefixes}
          semesters={semesters}
          batches={batches}
          onSuccess={() => { setEditModal(false); load() }}
        />
      )}
    </div>
  )
}
