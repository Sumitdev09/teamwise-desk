import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";
import Footer from "./Footer";

interface DashboardLayoutProps {
  children: ReactNode;
  role?: "admin" | "hr" | "employee";
}

const DashboardLayout = ({ children, role = "employee" }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const navItems = {
    admin: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Users, label: "Employees", path: "/employees" },
      { icon: Calendar, label: "Attendance", path: "/attendance" },
      { icon: DollarSign, label: "Payroll", path: "/payroll" },
      { icon: Building2, label: "Departments", path: "/departments" },
      { icon: FileText, label: "Leave Requests", path: "/leaves" },
    ],
    hr: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Users, label: "Employees", path: "/employees" },
      { icon: Calendar, label: "Attendance", path: "/attendance" },
      { icon: FileText, label: "Leave Requests", path: "/leaves" },
    ],
    employee: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Calendar, label: "My Attendance", path: "/my-attendance" },
      { icon: DollarSign, label: "My Payroll", path: "/my-payroll" },
      { icon: FileText, label: "My Leaves", path: "/my-leaves" },
    ],
  };

  const isActivePath = (path: string) => location.pathname === path;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        showMenuButton={true}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 transition-all duration-300 ease-in-out",
          "bg-gradient-to-b from-card via-card to-card/95",
          "border-r border-border shadow-lg",
          "translate-x-0 lg:translate-x-0",
          "max-lg:hidden max-lg:translate-x-full",
          sidebarOpen && "max-lg:block max-lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl shadow-md">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Staff Manager</h2>
                <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
              Navigation
            </p>
            {navItems[role].map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-12 px-4 rounded-xl transition-all duration-200",
                    "group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                      : "text-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 animate-pulse" />
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <div className="mb-3 px-3 py-2 bg-card rounded-lg">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">Role: {role}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-72 p-8 flex-1 mt-16">{children}</main>
      
      {/* Footer */}
      <div className="lg:ml-72">
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
