import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentDetail from "./pages/StudentDetail";
import FacultyDashboard from "./pages/FacultyDashboard";

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  if (!token) return <Navigate to="/" />;
  
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(userRole)) return <Navigate to="/" />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/student/:id" element={<PrivateRoute role="admin"><StudentDetail /></PrivateRoute>} />
      <Route path="/faculty" element={<PrivateRoute role={["faculty", "hod"]}><FacultyDashboard /></PrivateRoute>} />
      <Route path="/faculty/student/:id" element={<PrivateRoute role={["faculty", "hod"]}><StudentDetail /></PrivateRoute>} />
      <Route path="/student" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
    </Routes>
  );
}