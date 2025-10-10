import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Calendar as CalendarIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const MyLeaves = () => {
  const [role, setRole] = useState<"admin" | "hr" | "employee">("employee");
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>("");
  
  const [leaveType, setLeaveType] = useState("sick");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadUserRole();
    loadMyLeaves();
  }, []);

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

      // Get employee ID
      const empResult = await (supabase as any)
        .from("employees")
        .select("id")
        .eq("profile_id", user.id)
        .single();
      
      if (empResult.data) {
        setEmployeeId(empResult.data.id);
      }
    }
  };

  const loadMyLeaves = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await (supabase as any)
        .from("leave_requests")
        .select(`
          *,
          employees!inner (
            profile_id
          )
        `)
        .eq("employees.profile_id", user.id)
        .order("created_at", { ascending: false });

      if (result.data) {
        setLeaves(result.data);
      }
    } catch (error) {
      console.error("Error loading leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    try {
      const result = await (supabase as any)
        .from("leave_requests")
        .insert({
          employee_id: employeeId,
          leave_type: leaveType,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          reason: reason,
          status: "pending",
        });

      if (result.error) throw result.error;
      toast.success("Leave request submitted successfully!");
      setDialogOpen(false);
      resetForm();
      loadMyLeaves();
    } catch (error: any) {
      toast.error("Failed to submit leave request");
    }
  };

  const resetForm = () => {
    setLeaveType("sick");
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: { className: "bg-warning text-warning-foreground", icon: Clock },
      approved: { className: "bg-success text-success-foreground", icon: CheckCircle },
      rejected: { className: "bg-destructive text-destructive-foreground", icon: XCircle },
    };
    
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.className} variant="secondary">
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Leave Requests</h1>
            <p className="text-muted-foreground mt-2">
              Submit and track your leave requests
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover">
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for leave"
                    required
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Request</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
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
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No leave requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="capitalize">{leave.leave_type.replace("_", " ")}</TableCell>
                          <TableCell>{format(new Date(leave.start_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(new Date(leave.end_date), "MMM d, yyyy")}</TableCell>
                          <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                          <TableCell>{getStatusBadge(leave.status)}</TableCell>
                          <TableCell>{format(new Date(leave.created_at), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      ))
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

export default MyLeaves;
