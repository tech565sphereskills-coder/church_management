import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
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
import { MemberHealthScore } from '@/components/members/MemberHealthScore';
import { useMembers, type Member } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';

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
        const response = await api.get(`/members/${memberId}/`);
        setMember(response.data);
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/members')} className="w-fit p-0 h-9 text-slate-500 hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Members
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            {canManageAttendance && (
              <>
                <Button variant="outline" onClick={() => setShowSMS(true)} className="flex-1 sm:flex-none h-11 rounded-xl bg-white shadow-sm border-slate-200 font-bold">
                  <MessageSquare className="h-4 w-4 mr-2 text-primary" /> Send SMS
                </Button>
                <Button variant="outline" onClick={() => setShowEdit(true)} className="flex-1 sm:flex-none h-11 rounded-xl bg-white shadow-sm border-slate-200 font-bold">
                  <Pencil className="h-4 w-4 mr-2 text-blue-500" /> Edit
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
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.full_name}
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{member.full_name}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant="outline" className={`font-bold px-3 py-1 border-none shadow-sm ${statusStyle.color}`}>
                    {statusStyle.label}
                  </Badge>
                  {member.church_membership && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-none px-3 py-1 font-bold">
                      {member.church_membership.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Contact Details */}
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Contact Information</h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                    <p className="font-bold text-slate-900 truncate">{member.phone}</p>
                  </div>
                </a>

                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-200">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                      <p className="font-bold text-slate-900 truncate">{member.email}</p>
                    </div>
                  </a>
                )}

                {member.address && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 sm:col-span-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 shadow-lg shadow-amber-200">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                      <p className="font-bold text-slate-900">{member.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="grid gap-3 sm:grid-cols-2">
                 <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                    <p className="font-bold text-slate-800 capitalize flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {member.gender}
                    </p>
                 </div>
                 <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Joined</p>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {format(new Date(member.date_joined), 'MMM d, yyyy')}
                    </p>
                 </div>
              </div>

              {member.invited_by && (
                <div className="p-4 rounded-2xl border border-slate-100 bg-primary/5">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Invited By</p>
                  <p className="font-bold text-slate-800">{member.invited_by}</p>
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

          {/* Member Health Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-1"
          >
            <MemberHealthScore memberId={member.id} />
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
            member={member}
            onSave={async (id, data) => {
              const success = await updateMember(id, data);
              if (success) {
                // Refetch member
                try {
                  const response = await api.get(`/members/${id}/`);
                  setMember(response.data);
                } catch (error) {
                  console.error('Error refetching member:', error);
                }
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
