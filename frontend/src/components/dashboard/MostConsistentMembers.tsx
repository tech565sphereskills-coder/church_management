import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy } from 'lucide-react';

interface ConsistentMember {
  id: string;
  full_name: string;
  department: string | null;
  count: number;
}

export function MostConsistentMembers() {
  const [members, setMembers] = useState<ConsistentMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get('/members/consistent/');
        setMembers(response.data);
      } catch (e) {
        console.error('Error fetching consistent members:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Most Consistent Members
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No data yet</p>
        ) : (
          <div className="space-y-3">
            {members.map((m, i) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(m.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.department || 'General'}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {m.count} services
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
