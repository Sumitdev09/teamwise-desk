import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Download, Plus } from "lucide-react";
import { toast } from "sonner";

const Payroll = () => {
  const [role, setRole] = useState<"admin" | "hr" | "employee">("employee");
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadUserRole();
    loadPayrolls();
  }, [selectedMonth, selectedYear]);

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

  const loadPayrolls = async () => {
    try {
      const result = await (supabase as any)
        .from("payroll")
        .select(`
          *,
          employees (
            employee_id,
            profiles (first_name, last_name)
          )
        `)
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      if (result.data) {
        setPayrolls(result.data);
      }
    } catch (error) {
      console.error("Error loading payrolls:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    toast.info("Generating payroll for all employees...");
    // This would contain logic to calculate payroll based on attendance
    toast.success("Payroll generation feature coming soon!");
  };

  const updatePayrollStatus = async (id: string, status: string) => {
    try {
      const result = await (supabase as any)
        .from("payroll")
        .update({ status })
        .eq("id", id);

      if (result.error) throw result.error;
      toast.success(`Payroll status updated to ${status}`);
      loadPayrolls();
    } catch (error) {
      toast.error("Failed to update payroll status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      draft: "bg-muted text-muted-foreground",
      approved: "bg-success text-success-foreground",
      paid: "bg-primary text-primary-foreground",
    };
    
    return (
      <Badge className={variants[status]} variant="secondary">
        {status}
      </Badge>
    );
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Payroll Management</h1>
            <p className="text-muted-foreground mt-2">
              Process and manage employee payroll
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={generatePayroll}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Payroll
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {months.map((month, idx) => (
                <SelectItem key={idx} value={(idx + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Records - {months[selectedMonth - 1]} {selectedYear}</CardTitle>
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
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Allowances</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrolls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No payroll records found for this period
                        </TableCell>
                      </TableRow>
                    ) : (
                      payrolls.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell className="font-medium">
                            {payroll.employees.employee_id}
                          </TableCell>
                          <TableCell>
                            {payroll.employees.profiles.first_name} {payroll.employees.profiles.last_name}
                          </TableCell>
                          <TableCell>${payroll.base_salary.toLocaleString()}</TableCell>
                          <TableCell className="text-success">
                            +${payroll.allowances.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-destructive">
                            -${payroll.deductions.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-bold">
                            ${payroll.net_salary.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {payroll.present_days}/{payroll.working_days}
                          </TableCell>
                          <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                          <TableCell>
                            <Select
                              value={payroll.status}
                              onValueChange={(value) => updatePayrollStatus(payroll.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
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

export default Payroll;
