import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Loader2 } from 'lucide-react';
import type { Member, MemberStatus } from '@/hooks/useMembers';
import { useDepartments } from '@/hooks/useDepartments';
import { useFamilies, Family } from '@/hooks/useFamilies';

// Departments constant removed to use dynamic data

const editSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  gender: z.enum(['male', 'female']),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'first_timer']),
  date_of_birth: z.string().optional(),
  departments: z.array(z.string()).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  family: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSave: (id: string, data: Partial<EditFormData>) => Promise<boolean>;
}

export function EditMemberDialog({ open, onOpenChange, member, onSave }: EditMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { departments } = useDepartments();
  const { families } = useFamilies();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      full_name: '', phone: '', gender: 'male', 
      email: '', address: '', status: 'active', date_of_birth: '',
      departments: [],
      family: '',
    },
  });

  useEffect(() => {
    if (member && open) {
      form.reset({
        full_name: member.full_name,
        phone: member.phone,
        gender: member.gender,
        address: member.address || '',
        status: member.status,
        date_of_birth: member.date_of_birth || '',
        departments: member.departments || [],
        email: member.email || '',
        family: member.family || '',
      });
    }
  }, [member, open, form]);

  const onSubmit = async (data: EditFormData) => {
    if (!member) return;
    setIsLoading(true);
    
    // Create a typed updates object
    const updates: Partial<EditFormData> & { email?: string | null; address?: string | null; date_of_birth?: string | null } = { ...data };
    
    if (updates.departments && updates.departments.length === 0) {
        // Option to handle empty depts if needed
    }
    
    if (!updates.email) updates.email = null;
    if (!updates.address) updates.address = null;
    if (!updates.date_of_birth) updates.date_of_birth = null;

    const success = await onSave(member.id, updates as Partial<EditFormData>);
    if (success) onOpenChange(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Member
          </DialogTitle>
          <DialogDescription>Update member information</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="first_timer">First Timer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="family" render={({ field }) => (
                <FormItem>
                  <FormLabel>Family</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="Select family" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">-- None --</SelectItem>
                      {families.map((f: Family) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField
                control={form.control}
                name="departments"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Departments (Select multiple)</FormLabel>
                    <div className="grid grid-cols-2 gap-2 p-4 rounded-xl border bg-slate-50/50">
                      {departments.map((dept) => (
                        <div key={dept.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-dept-${dept.id}`}
                            checked={field.value?.includes(dept.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, dept.id]);
                              } else {
                                field.onChange(current.filter((id) => id !== dept.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`edit-dept-${dept.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {dept.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="btn-gold flex-1" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Pencil className="mr-2 h-4 w-4" />Save Changes</>}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
