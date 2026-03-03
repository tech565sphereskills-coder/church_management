import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  CheckCircle2, 
  HelpingHand,
  MessageSquare,
  ChevronRight,
  Heart
} from 'lucide-react';
import { usePrayer } from '@/hooks/usePrayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export default function SubmitPrayer() {
  const { submitRequest } = usePrayer();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [request, setRequest] = useState({
    requester_name: '',
    request_text: '',
    is_anonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await submitRequest(request);
    setLoading(false);
    if (success) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="text-center shadow-xl border-t-4 border-primary">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <CardTitle className="text-2xl font-bold">Request Received</CardTitle>
              <CardDescription className="text-lg">
                Your prayer request has been sent to our prayer team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                "For where two or three are gathered together in my name, there am I in the midst of them." 
                <span className="block italic mt-2">— Matthew 18:20</span>
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSubmitted(false)}
                className="w-full"
              >
                Submit Internal Request
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto flex flex-col items-center"
          >
            <div className="w-24 h-24 mb-6 rounded-full overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src="/rccg_logo.png" 
                alt="RCCG Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Emmanuel Sanctuary Prayer Link
            </h1>
            <p className="text-red-600 font-bold text-lg">
              RCCG Sanctuary Prayer Department
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-2xl border-none bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-8">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="name" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                        Full Name
                      </Label>
                      <span className="text-xs text-slate-400">Optional if anonymous</span>
                    </div>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={request.requester_name}
                      onChange={(e) => setRequest({...request, requester_name: e.target.value})}
                      disabled={request.is_anonymous}
                      className="h-12 border-slate-200 focus:ring-primary transition-all text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                      Prayer Need
                    </Label>
                    <Textarea
                      id="text"
                      placeholder="Tell us what you would like us to pray for..."
                      value={request.request_text}
                      onChange={(e) => setRequest({...request, request_text: e.target.value})}
                      required
                      className="min-h-[160px] border-slate-200 focus:ring-primary transition-all text-lg resize-none p-4"
                    />
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                    <Checkbox 
                      id="anonymous" 
                      className="mt-1"
                      checked={request.is_anonymous}
                      onCheckedChange={(checked) => setRequest({...request, is_anonymous: checked as boolean})}
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="anonymous"
                        className="text-sm font-semibold text-slate-700 leading-none cursor-pointer"
                      >
                        Keep this request anonymous
                      </label>
                      <p className="text-xs text-slate-500">
                        We will still pray for you, but your name won't be displayed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-8">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 text-lg font-bold gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      SUBMIT REQUEST
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>

        <div className="flex items-center justify-center gap-6 text-slate-400">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-red-400 fill-red-400" />
            <span className="text-sm font-medium">Faithful</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4 text-blue-400 fill-blue-400" />
            <span className="text-sm font-medium">Confidential</span>
          </div>
        </div>
      </div>
    </div>
  );
}
