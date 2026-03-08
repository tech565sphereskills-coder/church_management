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
import { Banknote, Loader2, Search } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';

const contributionTypes = [
  { value: 'tithe', label: 'Tithe' },
  { value: 'offering', label: 'Offering' },
  { value: 'welfare', label: 'Welfare' },
  { value: 'building_fund', label: 'Building Fund' },
  { value: 'thanksgiving', label: 'Thanksgiving' },
  { value: 'seeds', label: 'Seeds' },
  { value: 'donation', label: 'Donation' },
  { value: 'other', label: 'Other' },
];

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'pos', label: 'POS' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online' },
];

const formSchema = z.object({
  member: z.string().optional().nullable(),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  contribution_type: z.enum(['tithe', 'offering', 'welfare', 'building_fund', 'thanksgiving', 'seeds', 'donation', 'other']),
  date: z.string(),
  payment_method: z.enum(['cash', 'bank_transfer', 'pos', 'cheque', 'online']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<import('@/hooks/useFinancials').Contribution>) => Promise<import('@/hooks/useFinancials').Contribution | null>;
  initialData?: import('@/hooks/useFinancials').Contribution;
}

export function ContributionDialog({ open, onOpenChange, onSave, initialData }: ContributionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { members } = useMembers();
  const [memberSearch, setMemberSearch] = useState('');

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone.includes(memberSearch)
  ).slice(0, 5);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      member: null,
      amount: '',
      contribution_type: 'tithe',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      notes: '',
    },
  });

  // Update form when initialData changes or dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          member: initialData.member,
          amount: initialData.amount,
          contribution_type: initialData.contribution_type,
          date: initialData.date,
          payment_method: initialData.payment_method,
          notes: initialData.notes || '',
        });
      } else {
        form.reset({
          member: null,
          amount: '',
          contribution_type: 'tithe',
          date: new Date().toISOString().split('T')[0],
          payment_method: 'bank_transfer',
          notes: '',
        });
      }
    }
  }, [open, initialData, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const success = await onSave({
      member: data.member,
      amount: data.amount,
      contribution_type: data.contribution_type as import('@/hooks/useFinancials').ContributionType,
      date: data.date,
      payment_method: data.payment_method as import('@/hooks/useFinancials').PaymentMethod,
      notes: data.notes,
    });
    if (success) {
      form.reset();
      onOpenChange(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            {initialData ? 'Edit Contribution' : 'Record Contribution'}
          </DialogTitle>
          <DialogDescription>
            Enter details for tithes, offerings, or other church funds.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="member"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member (Leave empty for anonymous)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'anonymous'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Search/Select Member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="flex items-center gap-2 p-2 border-b">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search..." 
                          className="h-8 border-none focus-visible:ring-0" 
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                        />
                      </div>
                      <SelectItem value="anonymous">Anonymous / Visitor</SelectItem>
                      {filteredMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.full_name} ({m.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (NGN) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contribution_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contributionTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Extra details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Saving...
                  </>
                ) : (
                  <>
                    <Banknote className="mr-2 h-4 w-4" />
                    {initialData ? 'Update Record' : 'Record Payment'}
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
