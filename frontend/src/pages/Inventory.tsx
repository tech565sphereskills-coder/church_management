import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Search, Trash2, Edit3, Boxes, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function Inventory() {
  const { items, isLoading, createItem, updateItem, deleteItem } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: 1,
    category: ''
  });

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await updateItem(editingItem.id, formData);
    } else {
      await createItem(formData);
    }
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', quantity: 1, category: '' });
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: item.quantity,
      category: item.category
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Church Inventory" subtitle="Loading Assets..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-full max-w-md rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header 
        title="Church Inventory" 
        subtitle="Manage and track church assets, equipment, and resources." 
      />

      <div className="p-6 space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search items or categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <Button 
            onClick={() => {
              setEditingItem(null);
              setFormData({ name: '', description: '', price: '', quantity: 1, category: '' });
              setIsDialogOpen(true);
            }}
            className="w-full md:w-auto btn-gold rounded-2xl h-12 px-6 shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Asset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode='popLayout'>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-500">
                        <Package className="h-7 w-7" />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5" onClick={() => handleEdit(item)}>
                          <Edit3 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-destructive hover:bg-destructive/5" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight mt-6">{item.name}</CardTitle>
                    <CardDescription className="font-bold text-indigo-600/70 uppercase text-[10px] tracking-widest mt-1">
                      {item.category || 'Uncategorized'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <p className="text-slate-500 text-sm line-clamp-2 min-h-[2.5rem] leading-relaxed">
                      {item.description || 'No description provided.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50">
                        <p className="text-[10px] uppercase font-black text-emerald-600/60 tracking-wider mb-1">Value/Price</p>
                        <div className="flex items-center gap-1 font-black text-emerald-700">
                          <DollarSign className="h-4 w-4" />
                          <span>{parseFloat(item.price).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100/50">
                        <p className="text-[10px] uppercase font-black text-amber-600/60 tracking-wider mb-1">Quantity</p>
                        <div className="flex items-center gap-1 font-black text-amber-700">
                          <Boxes className="h-4 w-4" />
                          <span>{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-10" />
            <p className="text-xl font-bold italic tracking-tight">No assets found.</p>
            <Button variant="link" className="mt-2 text-primary font-bold" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-10 border-none shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black tracking-tight text-slate-900">
              {editingItem ? 'Edit Asset' : 'Add New Asset'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Enter the details of the church property or equipment.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Asset Name</label>
              <Input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Sound Mixer, Bus, Chairs"
                className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Price (NGN)</label>
                <Input 
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Quantity</label>
                <Input 
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Category</label>
              <Input 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                placeholder="e.g. Media, Transport, Furniture"
                className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Details / Description</label>
              <Input 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="More details about the asset..."
                className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold"
              />
            </div>

            <DialogFooter className="pt-6">
              <Button type="submit" className="w-full btn-gold h-16 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {editingItem ? 'Save Changes' : 'Add to Inventory'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
