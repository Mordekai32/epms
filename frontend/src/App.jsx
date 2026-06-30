import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import DepartmentsPage from "./pages/DepartmentsPage.jsx";
import SalariesPage from "./pages/SalariesPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import KPIsPage from "./pages/KPIsPage.jsx";
import GoalsPage from "./pages/GoalsPage.jsx";
import PerformanceReviewsPage from "./pages/PerformanceReviewsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MyPerformancePage from "./pages/MyPerformancePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={
          <RoleRoute allowedRoles={["admin", "manager"]}><EmployeesPage /></RoleRoute>
        } />
        <Route path="departments" element={
          <RoleRoute allowedRoles={["admin"]}><DepartmentsPage /></RoleRoute>
        } />
        <Route path="kpis" element={
          <RoleRoute allowedRoles={["admin", "manager"]}><KPIsPage /></RoleRoute>
        } />
        <Route path="goals" element={
          <RoleRoute allowedRoles={["admin", "manager"]}><GoalsPage /></RoleRoute>
        } />
        <Route path="reviews" element={
          <RoleRoute allowedRoles={["admin", "manager"]}><PerformanceReviewsPage /></RoleRoute>
        } />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="my-performance" element={
          <RoleRoute allowedRoles={["employee"]}><MyPerformancePage /></RoleRoute>
        } />
        <Route path="salaries" element={<SalariesPage />} />
        <Route path="reports" element={
          <RoleRoute allowedRoles={["admin", "manager"]}><ReportsPage /></RoleRoute>
        } />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}