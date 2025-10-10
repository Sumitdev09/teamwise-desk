import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

const Departments = () => {
  const [role, setRole] = useState<"admin" | "hr" | "employee">("employee");
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadUserRole();
    loadDepartments();
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
    }
  };

  const loadDepartments = async () => {
    try {
      const result = await (supabase as any)
        .from("departments")
        .select("*")
        .order("name");

      if (result.data) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDept) {
        const result = await (supabase as any)
          .from("departments")
          .update({ name, description })
          .eq("id", editingDept.id);

        if (result.error) throw result.error;
        toast.success("Department updated successfully!");
      } else {
        const result = await (supabase as any)
          .from("departments")
          .insert({ name, description });

        if (result.error) throw result.error;
        toast.success("Department created successfully!");
      }

      setDialogOpen(false);
      resetForm();
      loadDepartments();
    } catch (error: any) {
      toast.error(error.message || "Failed to save department");
    }
  };

  const handleEdit = (dept: any) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      const result = await (supabase as any)
        .from("departments")
        .delete()
        .eq("id", id);

      if (result.error) throw result.error;
      toast.success("Department deleted successfully!");
      loadDepartments();
    } catch (error: any) {
      toast.error("Failed to delete department");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingDept(null);
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-muted-foreground mt-2">
              Manage organizational departments and teams
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover">
              <DialogHeader>
                <DialogTitle>
                  {editingDept ? "Edit Department" : "Add New Department"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Engineering"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter department description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingDept ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : departments.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No departments found. Create your first department!
            </div>
          ) : (
            departments.map((dept) => (
              <Card key={dept.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(dept)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {dept.description || "No description provided"}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Departments;
