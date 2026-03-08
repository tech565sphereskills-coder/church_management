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
import { MemberStatus } from '@/hooks/useMembers';

export type Gender = 'male' | 'female';

export interface NewMemberData {
  full_name: string;
  phone: string;
  gender: Gender;
  invited_by?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  status: MemberStatus;
  departments?: string[];
  family?: string;
}

// Departments constant removed to use dynamic data

const formSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  gender: z.enum(['male', 'female']),
  date_of_birth: z.string().optional(),
  status: z.enum(['active', 'inactive', 'first_timer']),
  departments: z.array(z.string()).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  invited_by: z.string().optional(),
  family: z.string().optional(),
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
      full_name: initialName,
      phone: '',
      gender: 'male',
      date_of_birth: '',
      status: 'first_timer',
      departments: [],
      email: '',
      invited_by: '',
      family: '',
    },
  });

  // Update form when initialName changes
  useEffect(() => {
    if (initialName) {
      form.setValue('full_name', initialName);
    }
  }, [initialName, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    const newMember: NewMemberData = {
      full_name: data.full_name,
      phone: data.phone,
      gender: data.gender as Gender,
      email: data.email || undefined,
      date_of_birth: data.date_of_birth || undefined,
      status: data.status as MemberStatus,
      departments: data.departments || [],
      invited_by: data.invited_by || undefined,
      family: data.family || undefined,
    };

    await onMemberCreated(newMember);
    form.reset();
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Register New Member
          </DialogTitle>
          <DialogDescription>
            Quick registration for first-time visitors. They'll be automatically
            marked present after registration.
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="departments"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
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
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
                    <FormLabel>Date of Birth (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="family"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Family (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-2xl">
                          <SelectValue placeholder="Select a family" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl">
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
              
              <FormField
                control={form.control}
                name="invited_by"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Invited By (Optional)</FormLabel>
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
                  <FormItem className="md:col-span-2 flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-primary/5 border-primary/20">
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
                    Register & Mark Present
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
