import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import type { MemberStatus } from '@/hooks/useMembers';

const departments = [
  'Member', 'Choir', 'Ushering', 'Protocol', 'Media', 'Children',
  'Youth', 'Prayer', 'Welfare', 'Technical', 'Evangelism',
];

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onAssignDepartment: (department: string) => void;
  onChangeStatus: (status: MemberStatus) => void;
}

export function BulkActionsBar({ selectedCount, onClear, onAssignDepartment, onChangeStatus }: BulkActionsBarProps) {
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
        >
          <span className="text-sm font-medium text-primary">
            {selectedCount} member{selectedCount > 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2">
            <Select value={dept} onValueChange={(v) => { setDept(v); onAssignDepartment(v); setDept(''); }}>
              <SelectTrigger className="w-44 h-9">
                <Tag className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Assign Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => { setStatus(v); onChangeStatus(v as MemberStatus); setStatus(''); }}>
              <SelectTrigger className="w-40 h-9">
                <Users className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="first_timer">First Timer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
