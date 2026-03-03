import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Receipt } from 'lucide-react';
import { ExpenseCategory, Expense } from '@/hooks/useFinancials';

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Expense>) => Promise<unknown>;
}

export function ExpenseDialog({ open, onOpenChange, onSave }: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 'other' as ExpenseCategory,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        description: '',
        category: 'other',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save expense', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="bg-primary/5 p-8 border-b border-primary/10">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <DialogHeader className="p-0">
                <DialogTitle className="text-2xl font-bold text-slate-900">Record Expenditure</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium">Log church projects, maintenance, or daily expenses.</DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-slate-500">Short Description</Label>
              <Input
                id="desc"
                placeholder="e.g. Generator Maintenance, Electricity Bill"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-12 rounded-xl border-slate-200 focus:ring-primary shadow-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cat" className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val as ExpenseCategory })}
                >
                  <SelectTrigger id="cat" className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="salary">Salary / Welfare</SelectItem>
                    <SelectItem value="projects">Church Projects</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                    <SelectItem value="outreach">Outreach</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amt" className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount (₦)</Label>
                <Input
                  id="amt"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 focus:ring-primary shadow-none font-bold text-lg"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-slate-500">Transaction Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="h-12 rounded-xl border-slate-200 focus:ring-primary shadow-none"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500">Detailed Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any specific details about this outgoing..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="rounded-xl border-slate-200 focus:ring-primary shadow-none resize-none h-24"
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="h-12 rounded-xl px-6 flex-1 border-slate-200 font-bold"
            >
              Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={loading} 
                className="h-12 rounded-xl px-8 flex-[2] bg-slate-900 hover:bg-slate-800 text-white shadow-lg font-bold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
              Record Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
