import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Attendance = () => {
  const [role, setRole] = useState<"admin" | "hr" | "employee">("employee");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
    loadEmployees();
    loadAttendance();
  }, [selectedDate]);

  const loadUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.rpc('get_user_role', { 
        _user_id: user.id 
      });
      
      if (!error && data) {
        setRole(data as "admin" | "hr" | "employee");
      }
    }
  };

  const loadEmployees = async () => {
    const result = await (supabase as any)
      .from("employees")
      .select(`
        id,
        first_name,
        last_name,
        status
      `)
      .eq("status", "active");
    
    if (result.data) {
      setEmployees(result.data);
    }
  };

  const loadAttendance = async () => {
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const result = await (supabase as any)
        .from("attendance")
        .select(`
          *,
          employees (
            first_name,
            last_name
          )
        `)
        .eq("date", dateStr);

      if (result.data) {
        setAttendance(result.data);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (employeeId: string, status: string) => {
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const result = await (supabase as any)
        .from("attendance")
        .upsert({
          employee_id: employeeId,
          date: dateStr,
          status: status,
          check_in_time: status === "present" ? "09:00:00" : null,
          check_out_time: status === "present" ? "18:00:00" : null,
        }, {
          onConflict: "employee_id,date"
        });

      if (result.error) throw result.error;
      
      toast.success(`Attendance marked as ${status}`);
      loadAttendance();
    } catch (error: any) {
      toast.error("Failed to mark attendance");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      present: { className: "bg-success text-success-foreground", icon: CheckCircle },
      absent: { className: "bg-destructive text-destructive-foreground", icon: XCircle },
      half_day: { className: "bg-warning text-warning-foreground", icon: Clock },
      leave: { className: "bg-muted text-muted-foreground", icon: Clock },
    };
    
    const variant = variants[status] || variants.absent;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.className} variant="secondary">
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getAttendanceStatus = (employeeId: string) => {
    const record = attendance.find((a) => a.employee_id === employeeId);
    return record?.status || "absent";
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage employee attendance records
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendance for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No employees found
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((emp) => {
                        const status = getAttendanceStatus(emp.id);
                        const record = attendance.find((a) => a.employee_id === emp.id);
                        
                        return (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">
                              {emp.first_name} {emp.last_name}
                            </TableCell>
                            <TableCell>{getStatusBadge(status)}</TableCell>
                            <TableCell>{record?.check_in_time || "-"}</TableCell>
                            <TableCell>{record?.check_out_time || "-"}</TableCell>
                            <TableCell>
                              <Select
                                value={status}
                                onValueChange={(value) => markAttendance(emp.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover">
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="half_day">Half Day</SelectItem>
                                  <SelectItem value="leave">Leave</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
