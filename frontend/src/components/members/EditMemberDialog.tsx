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
  surname: z.string().min(2, 'Surname must be at least 2 characters'),
  firstname: z.string().min(2, 'Firstname must be at least 2 characters'),
  other_name: z.string().optional(),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  gender: z.enum(['male', 'female']),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'first_timer']),
  date_of_birth: z.string().optional(),
  departments: z.array(z.string()).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  family: z.string().optional(),
  marital_status: z.enum(['single', 'married', 'widowed', 'divorced']),
  spouse_full_name: z.string().optional(),
  spouse_phone_number: z.string().optional(),
  church_membership: z.enum(['worker', 'minister']).optional().or(z.literal('')),
  department_post: z.string().optional(),
  year_joined: z.coerce.number().optional().or(z.literal(0)),
<<<<<<< HEAD
=======
  year_joined_workforce: z.coerce.number().optional().or(z.literal(0)),
  is_ordained: z.boolean().default(false),
>>>>>>> e11383f (Added latest features)
  ordained_as: z.enum(['deacon', 'deaconess', 'full_pastor']).optional().or(z.literal('')),
  year_ordination: z.coerce.number().optional().or(z.literal(0)),
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
      surname: '', firstname: '', other_name: '', phone: '', gender: 'male', 
      email: '', address: '', status: 'active', date_of_birth: '',
      departments: [],
      family: '',
      marital_status: 'single',
      spouse_full_name: '',
      spouse_phone_number: '',
      church_membership: '',
      department_post: '',
      year_joined: undefined,
<<<<<<< HEAD
=======
      year_joined_workforce: undefined,
      is_ordained: false,
>>>>>>> e11383f (Added latest features)
      ordained_as: '',
      year_ordination: undefined,
    },
  });

  const maritalStatus = form.watch('marital_status');

  useEffect(() => {
    if (member && open) {
      form.reset({
        surname: member.surname || '',
        firstname: member.firstname || '',
        other_name: member.other_name || '',
        phone: member.phone,
        gender: member.gender,
        address: member.address || '',
        status: member.status,
        date_of_birth: member.date_of_birth || '',
        departments: member.departments || [],
        email: member.email || '',
        family: member.family || '',
        marital_status: member.marital_status || 'single',
        spouse_full_name: member.spouse_full_name || '',
        spouse_phone_number: member.spouse_phone_number || '',
        church_membership: member.church_membership || '',
        department_post: member.department_post || '',
        year_joined: member.year_joined || undefined,
<<<<<<< HEAD
=======
        year_joined_workforce: member.year_joined_workforce || undefined,
        is_ordained: member.is_ordained || false,
>>>>>>> e11383f (Added latest features)
        ordained_as: member.ordained_as || '',
        year_ordination: member.year_ordination || undefined,
      });
    }
  }, [member, open, form]);

  const onSubmit = async (data: EditFormData) => {
    if (!member) return;
    setIsLoading(true);
    
    // Create a typed updates object
<<<<<<< HEAD
    const updates: any = { ...data };
=======
    const updates: Partial<EditFormData> & Record<string, unknown> = { ...data };
>>>>>>> e11383f (Added latest features)
    
    if (!updates.email) updates.email = null;
    if (!updates.address) updates.address = null;
    if (!updates.date_of_birth) updates.date_of_birth = null;
    if (!updates.other_name) updates.other_name = null;
    if (!updates.spouse_full_name) updates.spouse_full_name = null;
    if (!updates.spouse_phone_number) updates.spouse_phone_number = null;
    if (!updates.church_membership) updates.church_membership = null;
    if (!updates.department_post) updates.department_post = null;
    if (!updates.year_joined) updates.year_joined = null;
<<<<<<< HEAD
=======
    if (!updates.year_joined_workforce) updates.year_joined_workforce = null;
>>>>>>> e11383f (Added latest features)
    if (!updates.ordained_as) updates.ordained_as = null;
    if (!updates.year_ordination) updates.year_ordination = null;

    const success = await onSave(member.id, updates);
    if (success) onOpenChange(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Member
          </DialogTitle>
          <DialogDescription>Update member information</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             {/* Personal Information */}
             <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="surname" render={({ field }) => (
                  <FormItem><FormLabel>Surname *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="firstname" render={({ field }) => (
                  <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="other_name" render={({ field }) => (
                  <FormItem><FormLabel>Other Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                  <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            {/* Family & Marital Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Family & Marital Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marital_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Family</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select family" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- None --</SelectItem>
                          {families.map((f: Family) => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {maritalStatus === 'married' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <FormField control={form.control} name="spouse_full_name" render={({ field }) => (
                    <FormItem><FormLabel>Spouse Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="spouse_phone_number" render={({ field }) => (
                    <FormItem><FormLabel>Spouse Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              )}
            </div>

            {/* Church Membership */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Church Membership</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="church_membership" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membership Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="worker">Worker</SelectItem><SelectItem value="minister">Minister</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="department_post" render={({ field }) => (
                  <FormItem><FormLabel>Post in Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="year_joined" render={({ field }) => (
<<<<<<< HEAD
                  <FormItem><FormLabel>Year Joined</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
=======
                  <FormItem><FormLabel>Year Joined RCCG</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="year_joined_workforce" render={({ field }) => (
                  <FormItem><FormLabel>Year Joined Workforce</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
>>>>>>> e11383f (Added latest features)
                )} />
              </div>

              <FormField
                control={form.control}
                name="departments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departments (Select multiple)</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 rounded-xl border bg-slate-50/50">
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
                          <label htmlFor={`edit-dept-${dept.id}`} className="text-sm font-medium leading-none cursor-pointer">{dept.name}</label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ordination Details */}
            <div className="space-y-4">
<<<<<<< HEAD
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Ordination Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="ordained_as" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currently Ordained As</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="deacon">Deacon</SelectItem>
                        <SelectItem value="deaconess">Deaconess</SelectItem>
                        <SelectItem value="full_pastor">Full Pastor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="year_ordination" render={({ field }) => (
                  <FormItem><FormLabel>Year of Ordination</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
=======
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Ordination Details</h3>
                <FormField
                  control={form.control}
                  name="is_ordained"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-xs font-black uppercase text-indigo-600 cursor-pointer">Are you ordained?</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('is_ordained') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <FormField control={form.control} name="ordained_as" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currently Ordained As</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="deacon">Deacon</SelectItem>
                          <SelectItem value="deaconess">Deaconess</SelectItem>
                          <SelectItem value="full_pastor">Full Pastor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="year_ordination" render={({ field }) => (
                    <FormItem><FormLabel>Year of Ordination</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              )}
>>>>>>> e11383f (Added latest features)
            </div>

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
