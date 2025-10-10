import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { toast } from "sonner";

const MyPayroll = () => {
  const [role, setRole] = useState<"admin" | "hr" | "employee">("employee");
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadUserRole();
    loadMyPayrolls();
  }, [selectedYear]);

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

  const loadMyPayrolls = async () => {
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

      const result = await (supabase as any)
        .from("payroll")
        .select("*")
        .eq("employee_id", empResult.data.id)
        .eq("year", selectedYear)
        .order("month", { ascending: false });

      if (result.data) {
        setPayrolls(result.data);
        if (result.data.length > 0) {
          setSelectedPayroll(result.data[0]);
        }
      }
    } catch (error) {
      console.error("Error loading payrolls:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = () => {
    toast.info("Payslip download feature coming soon!");
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

  const totalEarned = payrolls.reduce((sum, p) => sum + Number(p.net_salary), 0);

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Payroll</h1>
            <p className="text-muted-foreground mt-2">
              View your salary details and download payslips
            </p>
          </div>

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

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned ({selectedYear})</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarned.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {payrolls.length} payroll{payrolls.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Salary</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${selectedPayroll?.net_salary?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPayroll ? months[selectedPayroll.month - 1] : "No data"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {selectedPayroll && getStatusBadge(selectedPayroll.status)}
              <p className="text-xs text-muted-foreground mt-2">
                {selectedPayroll?.present_days || 0}/{selectedPayroll?.working_days || 0} days
              </p>
            </CardContent>
          </Card>
        </div>

        {selectedPayroll && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Payslip - {months[selectedPayroll.month - 1]} {selectedPayroll.year}
                </CardTitle>
                <Button variant="outline" onClick={downloadPayslip}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Earnings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Base Salary</span>
                      <span className="font-medium">${selectedPayroll.base_salary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-success">
                      <span className="text-sm flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Allowances
                      </span>
                      <span className="font-medium">+${selectedPayroll.allowances.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-destructive">
                      <span className="text-sm flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Total Deductions
                      </span>
                      <span className="font-medium">-${selectedPayroll.deductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Net Salary</span>
                  <span className="text-2xl font-bold text-primary">
                    ${selectedPayroll.net_salary.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="block">Working Days</span>
                  <span className="font-medium text-foreground">{selectedPayroll.working_days}</span>
                </div>
                <div>
                  <span className="block">Present Days</span>
                  <span className="font-medium text-foreground">{selectedPayroll.present_days}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment History ({selectedYear})</CardTitle>
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
                      <TableHead>Month</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Allowances</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrolls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No payroll records found for {selectedYear}
                        </TableCell>
                      </TableRow>
                    ) : (
                      payrolls.map((payroll) => (
                        <TableRow
                          key={payroll.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedPayroll(payroll)}
                        >
                          <TableCell className="font-medium">{months[payroll.month - 1]}</TableCell>
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
                          <TableCell>{getStatusBadge(payroll.status)}</TableCell>
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

export default MyPayroll;
