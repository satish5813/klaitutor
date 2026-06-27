# TutorIQ — AI Tutor Platform

LMS with role-based access. Faculty publish session-wise course content; only enrolled students can access it.

## Architecture
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Admin + Faculty portal:** React (web) — *Phase 2/3*
- **Student app:** Flutter (iOS + Android) — *Phase 4*

## Roles
| Role | Does |
|------|------|
| **Admin** | Create courses, create faculty, map faculty→course |
| **Faculty** | Create sessions, upload content (YouTube/infographic/PDF/PPT/mindmap), enroll students by email |
| **Student** | Login → see enrolled courses → read content |

## Content types per session
`youtube` (link) · `infographic` (image) · `pdf` · `ppt` · `mindmap` (image)

## Access rule
A student sees a course **only if** their email is in `enrollments` for that course. Enforced by Postgres Row Level Security (RLS) — not just the UI.

---

## Phase 1 — Database setup (this folder)

### 1. Create a Supabase project
Go to https://supabase.com → New Project. Note the **Project URL** and **anon key** (Settings → API).

### 2. Run the SQL (in order) in the SQL Editor
1. `backend/supabase/schema.sql` — tables, RLS, triggers
2. `backend/supabase/storage.sql` — file bucket + policies
3. Sign up your own account in the app/dashboard, then run
   `backend/supabase/seed.sql` (edit the email first) to become admin.

### 3. Storage file path convention
Upload faculty files as: `course-content/<course_id>/<session_id>/<filename>`
The first path segment (`course_id`) is what the storage policy checks for access.

---

## Data model
```
profiles(id, name, email, role)            -- extends auth.users
courses(id, title, description, cover_image, created_by)
faculty_course(faculty_id, course_id)      -- admin mapping
enrollments(course_id, student_email)      -- who can access (by email)
sessions(id, course_id, title, order_no)
contents(id, session_id, type, url, storage_path, order_no)
```

## Roadmap
- [x] **Phase 1** — DB schema, RLS, storage
- [ ] **Phase 2** — Admin web (courses, faculty, mapping)
- [ ] **Phase 3** — Faculty web (sessions, uploads, student enrollment)
- [ ] **Phase 4** — Student Flutter app
- [ ] **Phase 5** — Progress tracking, reports, notifications
