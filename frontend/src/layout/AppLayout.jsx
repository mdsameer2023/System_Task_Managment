import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  Sun,
  Users,
  X,
} from "lucide-react";
import { fetchNotifications, logout } from "../store";
import { cn } from "../components/ui";

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const unread = useSelector((s) => s.notifications.unreadCount);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(
    () => localStorage.getItem("taskflow_theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("taskflow_theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/tasks", label: "Tasks", icon: ListTodo },
    { to: "/notifications", label: "Notifications", icon: Bell, count: unread },
    ...(user?.role === "ADMIN"
      ? [{ to: "/admin/users", label: "Users", icon: Users }]
      : []),
  ];
  const signOut = () => {
    dispatch(logout());
    navigate("/login");
  };
  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "app-sidebar fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white p-5 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}>
        <div className="flex h-14 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="brand-mark grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">
              T
            </span>
            <div>
              <strong className="block text-lg">TaskFlow</strong>
              <span className="text-xs text-slate-400">Work management</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav className="mt-8 space-y-1">
          {items.map(({ to, label, icon: Icon, count }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800",
                )
              }>
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                  {count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-profile mt-auto rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <p className="truncate font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          {(user?.role === "ADMIN" || user?.role === "USER") && (
            <span className="mt-2 inline-flex rounded-md bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-100">
              {user.role === "ADMIN" ? "Admin" : "User"}
            </span>
          )}
          <button
            onClick={signOut}
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-rose-600 dark:text-slate-300">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="app-header sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-8">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 lg:hidden"
            aria-label="Open navigation">
            <Menu />
          </button>
          <p className="hidden text-sm text-slate-500 sm:block">
            Plan clearly. Ship confidently.
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setDark((v) => !v)}
              aria-label="Toggle dark mode">
              {dark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <Link
              to="/notifications"
              className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
