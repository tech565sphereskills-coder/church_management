import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Baby, 
  Plus, 
  Search, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useChildren } from '@/hooks/useChildren';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function Children() {
  const { children, checkIns, loading, createChild, checkInChild, checkOutChild } = useChildren();
  const { members } = useMembers();
  const { services } = useAttendance();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  
  const [newChild, setNewChild] = useState({
    full_name: '',
    gender: 'male' as 'male' | 'female',
    date_of_birth: '',
    allergies: '',
    parent_1: '',
    parent_2: '',
    emergency_contact: '',
  });

  const [checkInData, setCheckInData] = useState({
    childId: '',
    serviceId: '',
  });

  const filteredChildren = children.filter(child => 
    child.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.check_in_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCheckIns = checkIns.filter(ci => !ci.checked_out_at);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createChild({
      ...newChild,
      parent_2: newChild.parent_2 || undefined,
    });
    if (success) {
      setIsRegisterOpen(false);
      setNewChild({
        full_name: '',
        gender: 'male',
        date_of_birth: '',
        allergies: '',
        parent_1: '',
        parent_2: '',
        emergency_contact: '',
      });
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInData.childId || !checkInData.serviceId) return;
    const success = await checkInChild(checkInData.childId, checkInData.serviceId);
    if (success) {
      setIsCheckInOpen(false);
      setCheckInData({ childId: '', serviceId: '' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Children's Department" 
        subtitle="Manage secure child check-ins and registrations."
      />

      <div className="p-6">
        <Tabs defaultValue="active" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="active">Active Check-ins</TabsTrigger>
              <TabsTrigger value="all">Directory</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Register
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Register New Child</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRegister} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={newChild.full_name}
                        onChange={(e) => setNewChild({...newChild, full_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select 
                          value={newChild.gender} 
                          onValueChange={(v: 'male' | 'female') => setNewChild({...newChild, gender: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={newChild.date_of_birth}
                          onChange={(e) => setNewChild({...newChild, date_of_birth: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Parent/Guardian</Label>
                      <Select 
                        value={newChild.parent_1} 
                        onValueChange={(v) => setNewChild({...newChild, parent_1: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Allergies / Special Notes</Label>
                      <Input
                        id="allergies"
                        value={newChild.allergies}
                        onChange={(e) => setNewChild({...newChild, allergies: e.target.value})}
                        placeholder="e.g., Peanuts, Asthma"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency">Emergency Contact (Optional)</Label>
                      <Input
                        id="emergency"
                        value={newChild.emergency_contact}
                        onChange={(e) => setNewChild({...newChild, emergency_contact: e.target.value})}
                        placeholder="Name and Phone"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full">Register Child</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Check-In
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Child Check-In</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCheckIn} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Child</Label>
                      <Select 
                        value={checkInData.childId} 
                        onValueChange={(v) => setCheckInData({...checkInData, childId: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select child" />
                        </SelectTrigger>
                        <SelectContent>
                          {children.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.full_name} ({c.check_in_code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Service</Label>
                      <Select 
                        value={checkInData.serviceId} 
                        onValueChange={(v) => setCheckInData({...checkInData, serviceId: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select current service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.service_date})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full">Confirm Check-In</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="active" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeCheckIns.length === 0 ? (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-4">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No active check-ins</h3>
                    <p className="text-sm text-muted-foreground">Children checked in for service will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                activeCheckIns.map((ci) => (
                  <motion.div
                    key={ci.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="overflow-hidden border-2 border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-primary/20 text-primary uppercase font-mono">
                            Code: {children.find(c => c.id === ci.child)?.check_in_code}
                          </Badge>
                          <Badge className="bg-success">Checked In</Badge>
                        </div>
                        <CardTitle className="mt-2 text-xl">{ci.child_name}</CardTitle>
                        <CardDescription>{ci.service_name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Time:</span>
                            <span className="font-medium">{format(new Date(ci.checked_in_at), 'HH:mm')}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Parent:</span>
                            <span className="font-medium">
                              {children.find(c => c.id === ci.child)?.parent_1_name}
                            </span>
                          </div>
                          {children.find(c => c.id === ci.child)?.allergies && (
                            <div className="mt-4 rounded-lg bg-warning/10 p-3 text-warning">
                              <div className="flex items-center gap-2 font-semibold">
                                <AlertCircle className="h-4 w-4" />
                                <span>Medical Alert</span>
                              </div>
                              <p className="mt-1">{children.find(c => c.id === ci.child)?.allergies}</p>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="destructive" 
                          className="mt-6 w-full gap-2"
                          onClick={() => checkOutChild(ci.id)}
                        >
                          <LogOut className="h-4 w-4" />
                          Process Pick-up
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="all">
            <div className="rounded-xl border bg-card">
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {filteredChildren.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/10">
                          <AvatarFallback className="bg-primary/5 text-primary">
                            {getInitials(child.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{child.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()} years</span>
                            <span>•</span>
                            <span className="font-mono">{child.check_in_code}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="hidden text-right lg:block">
                          <p className="text-sm font-medium">{child.parent_1_name}</p>
                          <p className="text-xs text-muted-foreground">Parent/Guardian</p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredChildren.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">No children found.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
