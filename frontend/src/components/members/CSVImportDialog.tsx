import { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileUp, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Loader2,
  Trash2,
  UserPlus
} from 'lucide-react';
import { useMembers, NewMemberData, Member, Gender } from '@/hooks/useMembers';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface ImportRow {
  index: number;
  data: NewMemberData;
  status: 'pending' | 'valid' | 'invalid' | 'duplicate' | 'success' | 'error';
  errors: string[];
}

export function CSVImportDialog({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) {
  const { members, createMember } = useMembers();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
  } | null>(null);
  const [activeMode, setActiveMode] = useState<'interactive' | 'pro'>('interactive');

  const stats = useMemo(() => {
    const valid = importRows.filter(r => r.status === 'valid').length;
    const invalid = importRows.filter(r => r.status === 'invalid').length;
    const duplicate = importRows.filter(r => r.status === 'duplicate').length;
    return { valid, invalid, duplicate };
  }, [importRows]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isCSV = selectedFile.name.endsWith('.csv');
      const isExcel = selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.xlsx');
      
      if (!isCSV && !isExcel) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV or Excel file.',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
      if (isCSV) {
        parseCSV(selectedFile);
      } else {
        setActiveMode('pro'); // Excel must use Pro mode
      }
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ImportRow[] = results.data.map((row: Record<string, string>, index) => {
          const errors: string[] = [];
          
          // Name extraction
          const surname = row['Surname'] || row['surname'] || '';
          const firstname = row['First Name'] || row['firstname'] || row['Firstname'] || '';
          const otherName = row['Other Name'] || row['other_name'] || '';
          const fullNameField = row['Full Name'] || row['full_name'] || row['Name'] || '';
          
          let finalSurname = surname;
          let finalFirstname = firstname;
          let finalOtherName = otherName;

          if ((!surname || !firstname) && fullNameField) {
            const names = fullNameField.trim().split(' ');
            finalSurname = names[0] || '';
            finalFirstname = names[1] || '';
            finalOtherName = names.slice(2).join(' ');
          }

          const phone = (row['Phone'] || row['phone'] || row['Mobile'] || '').toString().replace(/\D/g, '');
          const email = row['Email'] || row['email'] || '';
          const genderInput = (row['Gender'] || row['gender'] || 'male').toLowerCase();
          const maritalStatus = row['Marital Status'] || row['marital_status'] || 'single';
          const departmentPost = row['Department Post'] || row['department_post'] || '';
          const address = row['Address'] || row['address'] || '';
          
          // Validation
          if (!finalSurname || !finalFirstname) errors.push('Name is required (Surname & First Name)');
          if (!phone || phone.length < 10) errors.push('Valid phone number is required');
          
          let gender: Gender = 'male';
          if (genderInput === 'female' || genderInput === 'f') {
            gender = 'female';
          }

          const memberData: NewMemberData = {
            surname: finalSurname,
            firstname: finalFirstname,
            other_name: finalOtherName || undefined,
            phone,
            gender,
            email: email || undefined,
            marital_status: maritalStatus,
            department_post: departmentPost || undefined,
            address: address || undefined,
          };

          // Check for duplicates in current member list
          const isDuplicate = members.some(m => m.phone === phone);

          return {
            index,
            data: memberData,
            status: errors.length > 0 ? 'invalid' : (isDuplicate ? 'duplicate' : 'valid'),
            errors,
          };
        });
        setImportRows(rows);
      },
      error: (error) => {
        toast({
          title: 'Parsing Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleImport = async () => {
    const toImport = importRows.filter(r => r.status === 'valid');
    if (toImport.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;
    const skippedCount = importRows.filter(r => r.status === 'duplicate').length;

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      setProgress(Math.round(((i + 1) / toImport.length) * 100));
      
      const result = await createMember(row.data);
      if (result) {
        successCount++;
        setImportRows(prev => prev.map(r => r.index === row.index ? { ...r, status: 'success' } : r));
      } else {
        failedCount++;
        setImportRows(prev => prev.map(r => r.index === row.index ? { ...r, status: 'error', errors: ['API error'] } : r));
      }
    }

    setSummary({
      total: importRows.length,
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
    });
    setIsProcessing(false);
    if (onImportComplete && successCount > 0) onImportComplete();
  };

  const handleProImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(20);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/members/import_members/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        }
      });
      
      const { status: statusMsg, summary: importSummary, debug_info } = response.data;
      
      toast({
        title: 'Migration Processed',
        description: statusMsg,
      });
      
      if (importSummary) {
        setSummary({
          total: importSummary.total_rows,
          success: importSummary.created + importSummary.updated,
          failed: importSummary.skipped,
          skipped: importSummary.skipped,
        });
      }
      
      console.log('Import Debug Info:', debug_info);
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      if (onImportComplete) onImportComplete();
    } catch (error: any) {
      toast({
        title: 'Migration Failed',
        description: error.response?.data?.error || 'Failed to process file',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setImportRows([]);
    setProgress(0);
    setIsProcessing(false);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const headers = [
      'Surname', 'First Name', 'Other Name', 'Phone', 'Email', 'Gender', 
      'Marital Status', 'Spouse Full Name', 'Spouse Phone Number',
      'Address', 'Church Membership', 'Department Post', 'Year Joined',
      'Ordained As', 'Year Ordination'
    ];
    const sampleData = [
      'Doe', 'John', 'Quincy', '08012345678', 'john@example.com', 'Male',
      'Married', 'Jane Doe', '08087654321',
      '123 Sanctuary Way', 'Worker', 'Usher', '2020',
      'Deacon', '2022'
    ];
    
    const csvContent = headers.join(',') + '\n' + sampleData.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members_template.csv';
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isProcessing) onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Church Data Migration Suite
          </DialogTitle>
          <DialogDescription>
            Migrate your entire church database from Excel or CSV in seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as 'interactive' | 'pro')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="interactive" disabled={!!file && !file.name.endsWith('.csv')}>Interactive (CSV)</TabsTrigger>
              <TabsTrigger value="pro">Pro Migration (Excel/CSV)</TabsTrigger>
            </TabsList>
          </Tabs>
          {!file ? (
            <div 
              className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl p-12 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground">Supports .csv, .xls, .xlsx</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={(e) => {
                e.stopPropagation();
                downloadTemplate();
              }}>
                <Download className="mr-2 h-4 w-4" /> Download Template
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                {!isProcessing && !summary && (
                  <Button variant="ghost" size="icon" onClick={reset}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {summary ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Import Complete</h3>
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div>
                      <p className="text-2xl font-bold">{summary.total}</p>
                      <p className="text-xs text-muted-foreground">Total Rows</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{summary.success}</p>
                      <p className="text-xs text-muted-foreground">Success</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{summary.failed}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-muted-foreground">{summary.skipped}</p>
                      <p className="text-xs text-muted-foreground">Skipped</p>
                    </div>
                  </div>
                  <Button className="mt-8" onClick={() => onOpenChange(false)}>Close Dialog</Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-border rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-success">{stats.valid}</p>
                      <p className="text-[10px] text-muted-foreground">To Import</p>
                    </div>
                    <div className="border border-border rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-destructive">{stats.invalid}</p>
                      <p className="text-[10px] text-muted-foreground">Errors</p>
                    </div>
                    <div className="border border-border rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-warning">{stats.duplicate}</p>
                      <p className="text-[10px] text-muted-foreground">Duplicates</p>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 border border-border rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Surname</TableHead>
                          <TableHead>First Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importRows.map((row) => (
                          <TableRow key={row.index}>
                           <TableCell className="text-xs">{row.index + 1}</TableCell>
                            <TableCell className="font-bold text-sm">{row.data.surname}</TableCell>
                            <TableCell className="font-medium text-sm">{row.data.firstname}</TableCell>
                            <TableCell className="text-xs font-mono">{row.data.phone}</TableCell>
                            <TableCell>
                              {row.status === 'valid' && <Badge variant="outline" className="text-success border-success/30 bg-success/10 font-bold uppercase text-[9px]">Ready</Badge>}
                              {row.status === 'invalid' && (
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10 w-fit font-bold uppercase text-[9px]">Error</Badge>
                                  <span className="text-[10px] text-destructive font-medium">{row.errors.join(', ')}</span>
                                </div>
                              )}
                              {row.status === 'duplicate' && <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">Duplicate</Badge>}
                              {row.status === 'success' && <div className="flex items-center gap-1 text-success text-xs font-medium"><CheckCircle2 className="h-3 w-3" /> Imported</div>}
                              {row.status === 'error' && <div className="flex items-center gap-1 text-destructive text-xs font-medium"><AlertCircle className="h-3 w-3" /> Failed</div>}
                              {row.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </>
              )}
            </>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv,.xls,.xlsx"
          onChange={handleFileChange}
        />

        <DialogFooter className="border-t border-border pt-4">
          {isProcessing ? (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs">
                <span>Importing members...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="flex gap-2 w-full sm:justify-end">
              {!summary && (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  {activeMode === 'interactive' ? (
                    <Button 
                      className="btn-gold" 
                      disabled={!file || stats.valid === 0}
                      onClick={handleImport}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Import {stats.valid} Members
                    </Button>
                  ) : (
                    <Button 
                      className="btn-gold" 
                      disabled={!file}
                      onClick={handleProImport}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      One-Click Migration
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
