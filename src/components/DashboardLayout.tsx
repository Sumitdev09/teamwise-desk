import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Menu,
  X,
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          "fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar-background border-r border-sidebar-border transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border hidden lg:block">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">Staff Manager</h1>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{role} Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-16 lg:mt-0">
            {navItems[role].map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-sidebar-foreground">{user?.email}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 p-8 flex-1">{children}</main>
      
      {/* Footer */}
      <div className="lg:ml-64">
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
