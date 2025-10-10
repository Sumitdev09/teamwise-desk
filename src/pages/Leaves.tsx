import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Leaves = () => {
  const [role, setRole] = useState<"admin" | "hr" | "employee">("employee");
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    loadUserRole();
    loadLeaves();
  }, []);

  const loadUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
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

  const loadLeaves = async () => {
    try {
      const result = await (supabase as any)
        .from("leave_requests")
        .select(`
          *,
          employees (
            employee_id,
            profiles (first_name, last_name)
          ),
          reviewed_by:profiles!leave_requests_reviewed_by_fkey (first_name, last_name)
        `)
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

  const updateLeaveStatus = async (id: string, status: string) => {
    try {
      const result = await (supabase as any)
        .from("leave_requests")
        .update({
          status,
          reviewed_by: currentUserId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (result.error) throw result.error;
      toast.success(`Leave request ${status}`);
      loadLeaves();
    } catch (error) {
      toast.error("Failed to update leave request");
    }
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

  const getLeaveTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="capitalize">
        {type.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage employee leave requests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Leave Requests</CardTitle>
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
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewed By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No leave requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">
                            {leave.employees.profiles.first_name} {leave.employees.profiles.last_name}
                          </TableCell>
                          <TableCell>{getLeaveTypeBadge(leave.leave_type)}</TableCell>
                          <TableCell>{format(new Date(leave.start_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(new Date(leave.end_date), "MMM d, yyyy")}</TableCell>
                          <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                          <TableCell>{getStatusBadge(leave.status)}</TableCell>
                          <TableCell>
                            {leave.reviewed_by ? (
                              `${leave.reviewed_by.first_name} ${leave.reviewed_by.last_name}`
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {leave.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-success hover:bg-success/90"
                                  onClick={() => updateLeaveStatus(leave.id, "approved")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateLeaveStatus(leave.id, "rejected")}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
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

export default Leaves;
