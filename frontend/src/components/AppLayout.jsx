import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppLayout() {
  const { logout, user } = useAuth();

  const allLinks = [
    { to: "/dashboard", label: "🏠 Dashboard", roles: ["admin", "manager", "employee"] },
    { to: "/", label: "Employees", roles: ["admin", "manager"] },
    { to: "/departments", label: "Departments", roles: ["admin"] },
    { to: "/kpis", label: "KPIs", roles: ["admin", "manager"] },
    { to: "/goals", label: "Goals", roles: ["admin", "manager"] },
    { to: "/reviews", label: "Performance Reviews", roles: ["admin", "manager"] },
    { to: "/my-performance", label: "My Performance", roles: ["employee"] },
     
    { to: "/reports", label: "Reports", roles: ["admin", "manager"] },
    { to: "/profile", label: "👤My Profile", roles: ["admin", "manager", "employee"] },
  ];

  const links = allLinks.filter(link => link.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-surface text-ink md:grid md:grid-cols-[260px_1fr]">
      <aside className="bg-sidebar text-sidebar-text md:min-h-screen border-b-4 border-accent md:border-b-0 md:border-r-4">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-xs uppercase tracking-widest text-accent">EIC PMS</p>
          <h1 className="text-xl font-bold mt-1">EIC PMS</h1>
          <p className="text-xs text-white/50 mt-1 capitalize">👤 {user?.username} — {user?.role}</p>
        </div>
        <nav className="p-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? "bg-accent text-accent-text shadow" : "hover:bg-white/10"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-red-400 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}