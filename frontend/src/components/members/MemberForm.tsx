import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { UserPlus, Loader2, Camera, Plus, CheckCircle2, Info, Users, Briefcase, GraduationCap } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useDepartments } from '@/hooks/useDepartments';
import { useFamilies, Family } from '@/hooks/useFamilies';
import { MemberStatus, NewMemberData, Gender } from '@/hooks/useMembers';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  year_joined_workforce: z.string().optional(),
  is_ordained: z.boolean().default(false),
  ordained_as: z.enum(['deacon', 'deaconess', 'minister', 'assistant_pastor', 'full_pastor', '']).optional().or(z.literal('')),
  year_ordination: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MemberFormProps {
  onSuccess: (member: NewMemberData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialName?: string;
}

export function MemberForm({
  onSuccess,
  onCancel,
  isLoading: externalLoading = false,
  initialName = '',
}: MemberFormProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'church' | 'ordination'>('personal');
  const { departments } = useDepartments();
  const { families } = useFamilies();

  const isLoading = externalLoading || internalLoading;

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
      year_joined_workforce: '',
      is_ordained: false,
      ordained_as: '',
      year_ordination: '',
    },
  });

  const maritalStatus = form.watch('marital_status');
  const isOrdained = form.watch('is_ordained');

  useEffect(() => {
    if (initialName) {
      const names = initialName.split(' ');
      form.setValue('surname', names[0] || '');
      form.setValue('firstname', names[1] || '');
      form.setValue('other_name', names.slice(2).join(' ') || '');
    }
  }, [initialName, form]);

  const onSubmit = async (data: FormData) => {
    setInternalLoading(true);
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
      family: data.family === 'none' ? undefined : data.family,
      marital_status: data.marital_status,
      spouse_full_name: data.spouse_full_name || undefined,
      spouse_phone_number: data.spouse_phone_number || undefined,
      church_membership: data.church_membership || undefined,
      department_post: data.department_post || undefined,
      year_joined: data.year_joined ? parseInt(data.year_joined) : undefined,
      year_joined_workforce: data.year_joined_workforce ? parseInt(data.year_joined_workforce) : undefined,
      is_ordained: data.is_ordained,
      ordained_as: data.ordained_as || undefined,
      year_ordination: data.year_ordination ? parseInt(data.year_ordination) : undefined,
    };

    await onSuccess(newMember);
    setInternalLoading(false);
  };

  const tabs: { id: 'personal' | 'church' | 'ordination'; label: string; icon: typeof Info }[] = [
    { id: 'personal', label: 'Personal', icon: Info },
    { id: 'church', label: 'Church', icon: Users },
    { id: 'ordination', label: 'Growth', icon: GraduationCap },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Photo Section - Visual Anchor */}
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-100 mb-8 shadow-sm">
        <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload-full')?.click()}>
          <div className="h-32 w-32 rounded-3xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden transition-all group-hover:border-primary group-hover:scale-[1.02] shadow-xl shadow-slate-200/50">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-slate-300">
                <Camera className="h-10 w-10 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
            <Plus className="h-5 w-5" />
          </div>
          <input 
            id="photo-upload-full" 
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
        <div className="text-center mt-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Register New Member</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Building the family of God</p>
        </div>
      </div>

      {/* Tabs for Desktop, stacked segments for mobile responsiveness */}
      <div className="flex p-1 bg-slate-100/50 rounded-2xl mb-8 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'personal' && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Surname *</FormLabel>
                        <FormControl>
                          <Input placeholder="Surname" className="h-12 rounded-xl bg-slate-50/50" {...field} />
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
                        <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="First Name" className="h-12 rounded-xl bg-slate-50/50" {...field} />
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
                        <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Other Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Other Name" className="h-12 rounded-xl bg-slate-50/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 08012345678" className="h-12 rounded-xl bg-slate-50/50" {...field} />
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
                        <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Gender *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-slate-50/50">
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
                        <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" className="h-12 rounded-xl bg-slate-50/50" {...field} />
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
                        <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-12 rounded-xl bg-slate-50/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6">Family & Marital Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="marital_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Marital Status *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl bg-slate-50/50">
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
                          <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Family (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl bg-slate-50/50">
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
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-6 rounded-2xl bg-primary/5 border border-primary/10"
                    >
                      <FormField
                        control={form.control}
                        name="spouse_full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Spouse Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter spouse name" className="h-10 rounded-lg bg-white" {...field} />
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
                            <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Spouse Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter spouse phone" className="h-10 rounded-lg bg-white" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'church' && (
              <motion.div
                key="church"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none mb-4 block">Membership Status</FormLabel>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                          {['active', 'inactive', 'first_timer'].map((s) => (
                             <button
                                key={s}
                                type="button"
                                onClick={() => field.onChange(s)}
                                className={cn(
                                  "py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all",
                                  field.value === s ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                             >
                               {s.replace('_', ' ')}
                             </button>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="church_membership"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Membership Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-slate-50/50">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">-- Regular Member --</SelectItem>
                            <SelectItem value="worker">Worker</SelectItem>
                            <SelectItem value="minister">Minister</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="department_post"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Post in Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Leader, Assistant" className="h-12 rounded-xl bg-slate-50/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="year_joined"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Year Joined RCCG</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="YYYY" className="h-12 rounded-xl bg-slate-50/50" {...field} />
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
                          <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Workforce Year</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="YYYY" className="h-12 rounded-xl bg-slate-50/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="departments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase text-slate-500 tracking-widest">Assigned Departments</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-6 rounded-2xl border bg-slate-50/30">
                        {departments.map((dept) => (
                          <div 
                            key={dept.id} 
                            className={cn(
                              "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer group",
                              field.value?.includes(dept.id) 
                                ? "bg-primary/5 border-primary/20" 
                                : "bg-white border-slate-100 hover:border-slate-200"
                            )}
                            onClick={() => {
                              const current = field.value || [];
                              if (current.includes(dept.id)) {
                                field.onChange(current.filter((id) => id !== dept.id));
                              } else {
                                field.onChange([...current, dept.id]);
                              }
                            }}
                          >
                            <div className={cn(
                              "h-5 w-5 rounded-md border flex items-center justify-center transition-colors",
                              field.value?.includes(dept.id) ? "bg-primary border-primary" : "bg-white border-slate-200"
                            )}>
                              {field.value?.includes(dept.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span className={cn(
                              "text-xs font-black uppercase tracking-tight",
                              field.value?.includes(dept.id) ? "text-primary" : "text-slate-500"
                            )}>
                              {dept.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}

            {activeTab === 'ordination' && (
              <motion.div
                key="ordination"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-32 w-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                  
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-indigo-900 tracking-tight">Ordination Status</h3>
                      <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Spiritual growth tracking</p>
                    </div>
                    <FormField
                      control={form.control}
                      name="is_ordained"
                      render={({ field }) => (
                        <div 
                          className={cn(
                            "relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer",
                            field.value ? "bg-indigo-600" : "bg-slate-200"
                          )}
                          onClick={() => field.onChange(!field.value)}
                        >
                          <span className={cn(
                            "inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm",
                            field.value ? "translate-x-7" : "translate-x-1"
                          )} />
                        </div>
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {isOrdained && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
                      >
                        <FormField
                          control={form.control}
                          name="ordained_as"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Currently Ordained As</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl bg-white border-indigo-100 shadow-sm transition-all focus:ring-indigo-500/20">
                                    <SelectValue placeholder="Select ordination" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="deacon">Deacon</SelectItem>
                                  <SelectItem value="deaconess">Deaconess</SelectItem>
                                  <SelectItem value="minister">Minister</SelectItem>
                                  <SelectItem value="assistant_pastor">Assistant Pastor</SelectItem>
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
                              <FormLabel className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Year of Ordination</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="YYYY" className="h-12 rounded-xl bg-white border-indigo-100" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-8 rounded-[2rem] bg-amber-50/30 border border-amber-100/50">
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 shrink-0 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                       <Info className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Registration Tip</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Accurate membership data helps us provide better pastoral care and community support. Ensure the phone number is correct for automated notifications.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-10 border-t border-slate-100">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                className="order-2 sm:order-1 h-14 rounded-2xl px-10 font-bold text-slate-400 hover:text-slate-800 transition-all border-slate-200"
                disabled={isLoading}
              >
                CANCEL
              </Button>
            )}
            <Button 
              type="submit" 
              className="order-1 sm:order-2 btn-gold h-14 rounded-2xl px-12 font-black tracking-[0.1em] shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  COMPLETE REGISTRATION
                  <CheckCircle2 className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
