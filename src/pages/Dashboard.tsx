import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, FileText } from "lucide-react";

const Dashboard = () => {
  const [role, setRole] = useState<"admin" | "hr" | "employee">("employee");
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalPayroll: 0,
  });

  useEffect(() => {
    loadUserRole();
    loadStats();
  }, []);

  const loadUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setRole(profile.role as "admin" | "hr" | "employee");
      }
    }
  };

  const loadStats = async () => {
    try {
      const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const today = new Date().toISOString().split("T")[0];
      const { count: presentCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("date", today)
        .eq("status", "present");

      const { count: leaveCount } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { data: payrollData } = await supabase
        .from("payroll")
        .select("net_salary")
        .eq("status", "approved");

      const totalPayroll = payrollData?.reduce((sum, p) => sum + Number(p.net_salary), 0) || 0;

      setStats({
        totalEmployees: employeeCount || 0,
        presentToday: presentCount || 0,
        pendingLeaves: leaveCount || 0,
        totalPayroll: totalPayroll,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: Calendar,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      icon: FileText,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Total Payroll",
      value: `$${stats.totalPayroll.toLocaleString()}`,
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <DashboardLayout role={role}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your system.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {role === "admin" && (
                <>
                  <p className="text-sm text-muted-foreground">• Manage employees and departments</p>
                  <p className="text-sm text-muted-foreground">• Process attendance records</p>
                  <p className="text-sm text-muted-foreground">• Generate payroll reports</p>
                  <p className="text-sm text-muted-foreground">• Review leave requests</p>
                </>
              )}
              {role === "hr" && (
                <>
                  <p className="text-sm text-muted-foreground">• View employee records</p>
                  <p className="text-sm text-muted-foreground">• Mark attendance</p>
                  <p className="text-sm text-muted-foreground">• Approve leave requests</p>
                  <p className="text-sm text-muted-foreground">• Generate reports</p>
                </>
              )}
              {role === "employee" && (
                <>
                  <p className="text-sm text-muted-foreground">• View your attendance history</p>
                  <p className="text-sm text-muted-foreground">• Check payslips</p>
                  <p className="text-sm text-muted-foreground">• Submit leave requests</p>
                  <p className="text-sm text-muted-foreground">• Update your profile</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity feed will appear here once you start using the system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
