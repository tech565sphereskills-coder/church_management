import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Plus, Settings2, ShieldCheck, UserCircle2, Search, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFamilies, Family } from '@/hooks/useFamilies';
import { useMembers, Member } from '@/hooks/useMembers';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function FamilyPage() {
  const { families, isLoading, createFamily, updateFamily } = useFamilies();
  const { members, loading: membersLoading } = useMembers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [familyHead, setFamilyHead] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const familyMembers = useMemo(() => {
    const map: Record<string, Member[]> = {};
    members.forEach(m => {
      if (m.family) {
        if (!map[m.family]) map[m.family] = [];
        map[m.family].push(m);
      }
    });
    return map;
  }, [members]);

  const filteredFamilies = families.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (editingFamily) {
      await updateFamily(editingFamily.id, familyName, familyHead === 'none' ? null : familyHead);
    } else {
      await createFamily(familyName, familyHead === 'none' ? null : familyHead);
    }
    setIsDialogOpen(false);
    setEditingFamily(null);
    setFamilyName('');
    setFamilyHead(null);
  };

  if (isLoading || membersLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Church Families" subtitle="Loading..." />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Church Families" subtitle="Building strong bonds within our church community through family units." />
      
      <div className="p-6 space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search families..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-white/80 border-none shadow-inner focus:ring-2 focus:ring-primary/20 transition-all font-bold"
            />
          </div>

          <Button onClick={() => {
            setEditingFamily(null);
            setFamilyName('');
            setFamilyHead(null);
            setIsDialogOpen(true);
          }} className="w-full md:w-auto btn-gold rounded-2xl h-12 px-6 shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" />
            Register New Family
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode='popLayout'>
            {filteredFamilies.map((family, index) => (
              <motion.div 
                key={family.id} 
                layout 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 bg-white overflow-hidden group">
                  <CardHeader className="bg-slate-50 p-10 border-b border-slate-100/50">
                    <div className="flex justify-between items-start">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform duration-500">
                        <Users className="h-9 w-9" />
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 text-slate-400 hover:bg-white hover:shadow-lg transition-all" onClick={() => {
                        setEditingFamily(family);
                        setFamilyName(family.name);
                        setFamilyHead(family.head);
                        setIsDialogOpen(true);
                      }}>
                        <Settings2 className="h-6 w-6" />
                      </Button>
                    </div>
                    <CardTitle className="text-4xl font-black text-slate-900 tracking-tight mt-6">{family.name}</CardTitle>
                    <div className="flex items-center gap-3 mt-4">
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full">
                        {family.member_count} {family.member_count === 1 ? 'Member' : 'Members'}
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Family Head: {family.head_name || 'TBD'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Family Members</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {familyMembers[family.id]?.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-default">
                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                               {m.photo_url ? (
                                  <img src={m.photo_url} className="h-full w-full object-cover" />
                               ) : (
                                  <UserCircle2 className="h-6 w-6 text-slate-300" />
                               )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-bold text-slate-700 truncate">{m.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{m.phone}</p>
                            </div>
                          </div>
                        ))}
                        {(!familyMembers[family.id] || familyMembers[family.id].length === 0) && (
                          <p className="text-xs font-bold text-slate-400 italic col-span-2 text-center py-4 bg-slate-25 rounded-2xl border-2 border-dashed border-slate-50">
                            No members registered in this family yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredFamilies.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-sm">
             <div className="mb-6 relative inline-block">
                <Users className="h-20 w-20 text-slate-100" />
                <Plus className="h-8 w-8 text-primary absolute -bottom-2 -right-2 bg-white rounded-full p-1" />
             </div>
             <p className="text-2xl font-black text-slate-300 tracking-tight italic">Create your first church family unit.</p>
             <p className="text-sm text-slate-400 mt-2 font-medium">Abraham, Jacob, and more families await.</p>
             <Button onClick={() => setIsDialogOpen(true)} className="btn-gold mt-8 rounded-2xl h-14 px-10 font-black text-lg shadow-2xl shadow-primary/20">
               Get Started
             </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-10 border-none shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Users className="h-32 w-32" />
          </div>
          <DialogHeader className="mb-8 relative z-10">
            <DialogTitle className="text-4xl font-black tracking-tight text-slate-900">{editingFamily ? 'Update Family' : 'New Church Family'}</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium mt-2">
              Organize members into spiritual growth units.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Family Name</label>
              <Input 
                value={familyName} 
                onChange={(e) => setFamilyName(e.target.value)} 
                placeholder="e.g. Abraham Family" 
                className="h-16 rounded-2xl bg-slate-50 border-none px-6 font-bold text-xl placeholder:text-slate-300" 
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1">Appoint Family Head</label>
              <Select onValueChange={setFamilyHead} value={familyHead || 'none'}>
                <SelectTrigger className="rounded-2xl h-16 bg-slate-50 border-none px-6 text-lg font-bold shadow-sm">
                  <SelectValue placeholder="Pick a member" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white/95 backdrop-blur-xl max-h-[300px]">
                  <SelectItem value="none" className="rounded-xl py-4 italic text-slate-400">-- No Designated Head --</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="rounded-xl py-4 font-bold hover:bg-primary/5 focus:bg-primary/5">
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1 mt-2">
                Tip: Only registered members can be designated as heads.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-12 relative z-10">
            <Button onClick={handleSubmit} className="btn-gold w-full h-16 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
              {editingFamily ? 'Save Family Updates' : 'Establish Family'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
