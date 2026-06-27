# TutorIQ — How to run (Local MySQL version)

No Supabase. Everything runs on your machine: **MySQL → Node API → React web app**.

## Login credentials (super admin)
```
Email:    admin@tutoriq.local
Password: Admin@123
```
(Created by the seed script. To reset it, run `npm run seed` in `backend-mysql`.)

---

## Start everything (2 terminals)

### Terminal 1 — Backend API
```powershell
cd D:\AITUTOR\backend-mysql
npm install      # first time only
npm run seed     # first time only — creates the super admin
npm start        # API runs on http://localhost:4000
```

### Terminal 2 — Web app (Admin + Faculty)
```powershell
cd D:\AITUTOR\web
npm install      # first time only
npm run dev      # opens http://localhost:5176
```

Open **http://localhost:5176** and log in with the credentials above.

---

## First-run checklist
1. Make sure the **MySQL80** service is running (it already is).
2. Database `tutoriq` + tables already created. To recreate:
   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot@123 -e "source D:/AITUTOR/backend-mysql/schema.sql"
   ```
3. Backend `.env` already has your DB password (`root@123`).

---

## What you can do
- **As Admin:** create courses → create faculty → map faculty to courses
- **As Faculty:** (log in with the faculty email/password you set) → My Courses →
  add sessions → upload content (YouTube link, infographic, PDF, PPT, mind map) → enroll students by email
- Uploaded files are stored in `backend-mysql/uploads/` and streamed back securely.

## Architecture
```
React web (5176)  ─┐
                   ├──► Node/Express API (4000) ──► MySQL (3306)
Flutter app (next)─┘            │
                                └──► uploads/ (files on disk)
```

## Roadmap
- [x] MySQL schema
- [x] Node/Express API (auth, courses, faculty, mapping, sessions, content, enrollment, file streaming)
- [x] React web app (admin + faculty) wired to the API
- [ ] **Next:** Flutter student mobile app (login → enrolled courses → read content)
