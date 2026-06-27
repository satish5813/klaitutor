import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Courses from './pages/Courses'
import Faculty from './pages/Faculty'
import Mapping from './pages/Mapping'
import MyCourses from './pages/MyCourses'
import CourseManage from './pages/CourseManage'
import Profile from './pages/Profile'
import Users from './pages/Users'
import Reports from './pages/Reports'
import StudentManagement from './pages/StudentManagement'
import StudentHome from './pages/student/StudentHome'
import StudentCourse from './pages/student/StudentCourse'

function Protected({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="p-10 text-slate-500">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

// Send each role to its home page.
function Home() {
  const { profile } = useAuth()
  if (!profile) return <div className="p-10 text-slate-500">Loading…</div>
  const home = profile.role === 'admin' ? '/courses' : profile.role === 'faculty' ? '/my-courses' : '/student'
  return <Navigate to={home} replace />
}

// Admin-only guard for admin pages.
function AdminOnly({ children }) {
  const { profile } = useAuth()
  if (!profile) return <div className="p-10 text-slate-500">Loading…</div>
  if (profile.role !== 'admin') return <Navigate to="/my-courses" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Home />} />
        <Route path="courses" element={<AdminOnly><Courses /></AdminOnly>} />
        <Route path="users" element={<AdminOnly><Users /></AdminOnly>} />
        <Route path="faculty" element={<AdminOnly><Faculty /></AdminOnly>} />
        <Route path="mapping" element={<AdminOnly><Mapping /></AdminOnly>} />
        <Route path="my-courses" element={<MyCourses />} />
        <Route path="course/:id" element={<CourseManage />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="student" element={<StudentHome />} />
        <Route path="student/course/:id" element={<StudentCourse />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
