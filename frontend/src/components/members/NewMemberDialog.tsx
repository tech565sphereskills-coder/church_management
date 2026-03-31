import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2, Image as ImageIcon, Camera, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useDepartments } from '@/hooks/useDepartments';
import { useFamilies, Family } from '@/hooks/useFamilies';
import { MemberStatus, NewMemberData, Gender } from '@/hooks/useMembers';

// Departments constant removed to use dynamic data

const formSchema = z.object({
  surname: z.string().min(2, 'Surname must be at least 2 characters'),
  firstname: z.string().min(2, 'Firstname must be at least 2 characters'),
  other_name: z.string().optional(),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  gender: z.enum(['male', 'female']),
  date_of_birth: z.string().optional(),
  status: z.enum(['active', 'inactive', 'first_timer']),
  departments: z.array(z.string()).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  invited_by: z.string().optional(),
  family: z.string().optional(),
  marital_status: z.enum(['single', 'married', 'widowed', 'divorced']),
  spouse_full_name: z.string().optional(),
  spouse_phone_number: z.string().optional(),
  church_membership: z.enum(['worker', 'minister']).optional().or(z.literal('')),
  department_post: z.string().optional(),
  year_joined: z.string().optional(),
<<<<<<< HEAD
=======
  year_joined_workforce: z.string().optional(),
  is_ordained: z.boolean().default(false),
>>>>>>> e11383f (Added latest features)
  ordained_as: z.enum(['deacon', 'deaconess', 'full_pastor']).optional().or(z.literal('')),
  year_ordination: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NewMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberCreated: (member: NewMemberData) => void;
  initialName?: string;
}

export function NewMemberDialog({
  open,
  onOpenChange,
  onMemberCreated,
  initialName = '',
}: NewMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { departments } = useDepartments();
  const { families } = useFamilies();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      surname: initialName.split(' ')[0] || '',
      firstname: initialName.split(' ')[1] || '',
      other_name: initialName.split(' ').slice(2).join(' ') || '',
      phone: '',
      gender: 'male',
      date_of_birth: '',
      status: 'first_timer',
      departments: [],
      email: '',
      invited_by: '',
      family: '',
      marital_status: 'single',
      spouse_full_name: '',
      spouse_phone_number: '',
      church_membership: '',
      department_post: '',
      year_joined: '',
<<<<<<< HEAD
=======
      year_joined_workforce: '',
      is_ordained: false,
>>>>>>> e11383f (Added latest features)
      ordained_as: '',
      year_ordination: '',
    },
  });

  const maritalStatus = form.watch('marital_status');

  // Update form when initialName changes
  useEffect(() => {
    if (initialName) {
      const names = initialName.split(' ');
      form.setValue('surname', names[0] || '');
      form.setValue('firstname', names[1] || '');
      form.setValue('other_name', names.slice(2).join(' ') || '');
    }
  }, [initialName, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    const newMember: NewMemberData = {
      surname: data.surname,
      firstname: data.firstname,
      other_name: data.other_name || undefined,
      phone: data.phone,
      gender: data.gender as Gender,
      email: data.email || undefined,
      date_of_birth: data.date_of_birth || undefined,
      status: data.status as MemberStatus,
      departments: data.departments || [],
      invited_by: data.invited_by || undefined,
      family: data.family || undefined,
      marital_status: data.marital_status,
      spouse_full_name: data.spouse_full_name || undefined,
      spouse_phone_number: data.spouse_phone_number || undefined,
      church_membership: data.church_membership || undefined,
      department_post: data.department_post || undefined,
      year_joined: data.year_joined ? parseInt(data.year_joined) : undefined,
<<<<<<< HEAD
=======
      year_joined_workforce: data.year_joined_workforce ? parseInt(data.year_joined_workforce) : undefined,
      is_ordained: data.is_ordained,
>>>>>>> e11383f (Added latest features)
      ordained_as: data.ordained_as || undefined,
      year_ordination: data.year_ordination ? parseInt(data.year_ordination) : undefined,
    };

    await onMemberCreated(newMember);
    form.reset();
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Register New Member
          </DialogTitle>
          <DialogDescription>
            Comprehensive registration for new members and visitors.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 bg-slate-50 border-y border-slate-100 -mx-6 mb-6">
           <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
              <div className="h-24 w-24 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden transition-all group-hover:border-primary">
                 {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                 ) : (
                    <div className="flex flex-col items-center text-slate-400">
                       <Camera className="h-8 w-8 mb-1" />
                       <span className="text-[10px] font-bold uppercase">Add Photo</span>
                    </div>
                 )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                 <Plus className="h-4 w-4" />
              </div>
              <input 
                id="photo-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPhotoPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
           </div>
           <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest italic">Optional: Member Photo</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname *</FormLabel>
                      <FormControl>
                        <Input placeholder="Surname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="other_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Other Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="08012345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormLabel>Family (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a family" />
                          </SelectTrigger>
                        </FormControl>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2">
                  <FormField
                    control={form.control}
                    name="spouse_full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spouse Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter spouse name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="spouse_phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spouse Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter spouse phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Church Membership */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Church Membership</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="church_membership"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membership Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="worker">Worker</SelectItem>
                          <SelectItem value="minister">Minister</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department_post"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post in Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Leader, Assistant" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year_joined"
                  render={({ field }) => (
                    <FormItem>
<<<<<<< HEAD
                      <FormLabel>Year Joined</FormLabel>
=======
                      <FormLabel>Year Joined RCCG</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year_joined_workforce"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Joined Workforce</FormLabel>
>>>>>>> e11383f (Added latest features)
                      <FormControl>
                        <Input type="number" placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            id={`dept-${dept.id}`}
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
                            htmlFor={`dept-${dept.id}`}
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
            </div>

            {/* Ordination Details */}
            <div className="space-y-4">
<<<<<<< HEAD
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Ordination Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ordained_as"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currently Ordained As</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ordination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="deacon">Deacon</SelectItem>
                          <SelectItem value="deaconess">Deaconess</SelectItem>
                          <SelectItem value="full_pastor">Full Pastor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year_ordination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Ordination</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
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
>>>>>>> e11383f (Added latest features)
                    </FormItem>
                  )}
                />
              </div>
<<<<<<< HEAD
=======
              
              {form.watch('is_ordained') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <FormField
                    control={form.control}
                    name="ordained_as"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currently Ordained As</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ordination" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="deacon">Deacon</SelectItem>
                            <SelectItem value="deaconess">Deaconess</SelectItem>
                            <SelectItem value="full_pastor">Full Pastor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year_ordination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year of Ordination</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="YYYY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
>>>>>>> e11383f (Added latest features)
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">Additional Info</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="invited_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invited By</FormLabel>
                      <FormControl>
                        <Input placeholder="Who invited them?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-primary/5 border-primary/20">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                          checked={field.value === 'first_timer'}
                          onChange={(e) => {
                            field.onChange(e.target.checked ? 'first_timer' : 'active');
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-bold text-primary">
                          Mark as First Timer
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          This will track them as a visitor for this month's statistics.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="btn-gold flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register Member
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export type { NewMemberData };
