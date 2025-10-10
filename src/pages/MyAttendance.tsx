import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

const MyAttendance = () => {
  const [role, setRole] = useState<"admin" | "hr" | "employee">("employee");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
  });

  useEffect(() => {
    loadUserRole();
    loadMyAttendance();
  }, [selectedMonth]);

  const loadUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const result = await (supabase as any)
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (result.data) {
        setRole(result.data.role as "admin" | "hr" | "employee");
      }
    }
  };

  const loadMyAttendance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get employee ID
      const empResult = await (supabase as any)
        .from("employees")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!empResult.data) return;

      const start = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

      const result = await (supabase as any)
        .from("attendance")
        .select("*")
        .eq("employee_id", empResult.data.id)
        .gte("date", start)
        .lte("date", end);

      if (result.data) {
        setAttendance(result.data);
        
        // Calculate stats
        const present = result.data.filter((a: any) => a.status === "present").length;
        const absent = result.data.filter((a: any) => a.status === "absent").length;
        const halfDay = result.data.filter((a: any) => a.status === "half_day").length;
        const leave = result.data.filter((a: any) => a.status === "leave").length;
        
        setStats({ present, absent, halfDay, leave });
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = attendance.find((a) => a.date === dateStr);
    return record?.status || null;
  };

  const getDayClassName = (date: Date) => {
    const status = getDateStatus(date);
    if (!status) return "";
    
    const statusColors: any = {
      present: "bg-success/20 text-success-foreground hover:bg-success/30",
      absent: "bg-destructive/20 text-destructive-foreground hover:bg-destructive/30",
      half_day: "bg-warning/20 text-warning-foreground hover:bg-warning/30",
      leave: "bg-muted text-muted-foreground hover:bg-muted/80",
    };
    
    return statusColors[status] || "";
  };

  const statCards = [
    { title: "Present Days", value: stats.present, icon: CheckCircle, color: "text-success" },
    { title: "Absent Days", value: stats.absent, icon: XCircle, color: "text-destructive" },
    { title: "Half Days", value: stats.halfDay, icon: Clock, color: "text-warning" },
    { title: "Leave Days", value: stats.leave, icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground mt-2">
            View your attendance records and history
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
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
              <CardTitle>Attendance Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(date)}
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  className={cn("rounded-md border pointer-events-auto")}
                  modifiers={{
                    present: (date) => getDateStatus(date) === "present",
                    absent: (date) => getDateStatus(date) === "absent",
                    halfDay: (date) => getDateStatus(date) === "half_day",
                    leave: (date) => getDateStatus(date) === "leave",
                  }}
                  modifiersClassNames={{
                    present: "bg-success/20 text-success-foreground",
                    absent: "bg-destructive/20 text-destructive-foreground",
                    halfDay: "bg-warning/20 text-warning-foreground",
                    leave: "bg-muted",
                  }}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-success/20 border border-success"></div>
                <div>
                  <p className="font-medium">Present</p>
                  <p className="text-sm text-muted-foreground">Full day attendance</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-warning/20 border border-warning"></div>
                <div>
                  <p className="font-medium">Half Day</p>
                  <p className="text-sm text-muted-foreground">Partial attendance</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-muted border border-muted-foreground"></div>
                <div>
                  <p className="font-medium">Leave</p>
                  <p className="text-sm text-muted-foreground">Approved leave</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-destructive/20 border border-destructive"></div>
                <div>
                  <p className="font-medium">Absent</p>
                  <p className="text-sm text-muted-foreground">Unmarked/absent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyAttendance;
