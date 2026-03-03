import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Phone, Mail, MapPin, Users, Calendar,
  Download, Loader2, User, Pencil, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { MemberAttendanceHistory } from '@/components/members/MemberAttendanceHistory';
import { EditMemberDialog } from '@/components/members/EditMemberDialog';
import { SendSMSDialog } from '@/components/sms/SendSMSDialog';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Database } from '@/integrations/supabase/types';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';

type Member = Database['public']['Tables']['members']['Row'];

const statusConfig: Record<string, { label: string; color: string }> = {
  active: {
    label: 'Active',
    color: 'bg-secondary/50 text-secondary-foreground border-secondary',
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-muted text-muted-foreground border-border',
  },
  first_timer: {
    label: 'First Timer',
    color: 'bg-accent/10 text-accent border-accent/20',
  },
};

export default function MemberProfile() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showSMS, setShowSMS] = useState(false);
  const { updateMember } = useMembers();
  const { canManageAttendance } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMember = async () => {
      if (!memberId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .maybeSingle();

        if (error) throw error;
        setMember(data);
      } catch (error) {
        console.error('Error fetching member:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [memberId]);

  const downloadQRCode = () => {
    if (!qrRef.current || !member) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `${member.full_name.replace(/\s+/g, '_')}_QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen">
        <Header title="Member Not Found" subtitle="The requested member could not be found" />
        <div className="p-6 text-center">
          <Button onClick={() => navigate('/members')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>
        </div>
      </div>
    );
  }

  const statusStyle = statusConfig[member.status] || statusConfig.active;

  return (
    <div className="min-h-screen">
      <Header title="Member Profile" subtitle={member.full_name} />

      <div className="p-6">
        <Breadcrumbs items={[
          { label: 'Members', href: '/members' },
          { label: member.full_name },
        ]} />
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" onClick={() => navigate('/members')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Members
          </Button>
          <div className="ml-auto flex gap-2">
            {canManageAttendance && (
              <>
                <Button variant="outline" onClick={() => setShowSMS(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Send SMS
                </Button>
                <Button variant="outline" onClick={() => setShowEdit(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 rounded-xl border border-border bg-card p-6"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.full_name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{member.full_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={statusStyle.color}>
                    {statusStyle.label}
                  </Badge>
                  {member.department && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {member.department}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{member.phone}</p>
                  </div>
                </a>

                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rccg-green/10">
                      <Mail className="h-5 w-5 text-rccg-green" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium truncate">{member.email}</p>
                    </div>
                  </a>
                )}

                {member.address && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border sm:col-span-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <MapPin className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{member.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{member.gender}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Joined</p>
                    <p className="font-medium">
                      {format(new Date(member.date_joined), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {member.invited_by && (
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm text-muted-foreground">Invited By</p>
                  <p className="font-medium">{member.invited_by}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* QR Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h3 className="font-semibold text-lg mb-4">Member QR Code</h3>
            
            <div 
              ref={qrRef}
              className="flex justify-center p-4 bg-white rounded-lg"
            >
              <QRCodeSVG
                value={member.qr_code || member.id}
                size={180}
                level="H"
                includeMargin
              />
            </div>

            <p className="text-center text-sm text-muted-foreground mt-3 font-mono">
              {member.qr_code || member.id.substring(0, 8).toUpperCase()}
            </p>

            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="w-full mt-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </motion.div>
        </div>

        {/* Attendance History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-semibold text-lg mb-4">Attendance History</h3>
          <MemberAttendanceHistory memberId={member.id} />
        </motion.div>
      </div>

      {member && (
        <>
          <EditMemberDialog
            open={showEdit}
            onOpenChange={setShowEdit}
            member={member as any}
            onSave={async (id, data) => {
              const success = await updateMember(id, data);
              if (success) {
                // Refetch member
                const { data: updated } = await supabase.from('members').select('*').eq('id', id).maybeSingle();
                if (updated) setMember(updated);
              }
              return success;
            }}
          />
          <SendSMSDialog
            open={showSMS}
            onOpenChange={setShowSMS}
            recipients={[{ id: member.id, phone: member.phone, name: member.full_name }]}
          />
        </>
      )}
    </div>
  );
}
