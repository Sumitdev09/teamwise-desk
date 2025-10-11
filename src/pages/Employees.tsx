import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  employee_id: string;
  designation: string;
  hire_date: string;
  base_salary: number;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  departments: {
    name: string;
  } | null;
}

const Employees = () => {
  const [role, setRole] = useState<"admin" | "hr" | "employee">("employee");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
    loadEmployees();
  }, []);

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
    try {
      const result = await (supabase as any)
        .from("employees")
        .select(`
          *,
          profiles (first_name, last_name, email),
          departments (name)
        `)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;
      setEmployees(result.data || []);
    } catch (error: any) {
      toast.error("Failed to load employees");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.profiles.first_name.toLowerCase().includes(searchLower) ||
      emp.profiles.last_name.toLowerCase().includes(searchLower) ||
      emp.profiles.email.toLowerCase().includes(searchLower) ||
      emp.employee_id.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "inactive":
        return "bg-warning text-warning-foreground";
      case "terminated":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Employees</h1>
            <p className="text-muted-foreground mt-2">
              Manage your organization's workforce
            </p>
          </div>
          {role === "admin" && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No employees found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">{emp.employee_id}</TableCell>
                          <TableCell>
                            {emp.profiles.first_name} {emp.profiles.last_name}
                          </TableCell>
                          <TableCell>{emp.profiles.email}</TableCell>
                          <TableCell>{emp.departments?.name || "N/A"}</TableCell>
                          <TableCell>{emp.designation}</TableCell>
                          <TableCell>${emp.base_salary.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(emp.status)} variant="secondary">
                              {emp.status}
                            </Badge>
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

export default Employees;
