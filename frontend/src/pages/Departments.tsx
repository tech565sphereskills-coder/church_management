import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  Search, 
  Users,
  UserCircle2,
  MoreVertical,
  Edit,
  Trash2,
  Info
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDepartments, Department } from '@/hooks/useDepartments';
import { DepartmentDialog } from '@/components/departments/DepartmentDialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

export default function Departments() {
  const { departments, loading, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin } = useAuth();

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.leader_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departments, searchQuery]);

  const handleEdit = (dept: Department) => {
    setSelectedDepartment(dept);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Departments" subtitle="Manage church ministries and groups" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Departments" subtitle="Manage church ministries and groups" />

      <div className="p-6">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search departments..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10" 
              />
            </div>
          </div>
          {isAdmin && (
            <Button onClick={handleAdd} className="btn-gold">
              <Plus className="mr-2 h-4 w-4" /> Add Department
            </Button>
          )}
        </div>

        {/* Departments Grid/Table */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept, index) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:bg-accent/5"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(dept)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteDepartment(dept.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold">{dept.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {dept.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{dept.member_count} Members</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{dept.leader_name || 'No Leader'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredDepartments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">No departments found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search query.</p>
          </div>
        )}
      </div>

      <DepartmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        department={selectedDepartment}
        onSave={selectedDepartment ? (data) => updateDepartment(selectedDepartment.id, data) : createDepartment}
      />
    </div>
  );
}
