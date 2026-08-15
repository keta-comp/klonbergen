import { motion } from 'framer-motion';
import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

/**
 * Shown to signed-in users whose account has not yet been approved
 * by a super admin. They stay authenticated but cannot enter the system.
 */
export default function PendingApproval() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md rounded-lg p-8 text-center"
      >
        <div className="mb-5 flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-8 w-8 text-primary" />
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-bold font-serif text-gold-gradient">Tastıyıqlaw kútilmekte</h1>
        <p className="mb-1 text-muted-foreground">
          Siz Google arqalı sátli kirdińiz, biraq akkauntıńız ele admin tárepinen tastıyıqlanbaǵan.
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Admin tastıyıqlaǵannan keyin sistemaǵa kire alasız.
        </p>
        {user?.email && (
          <p className="mb-6 rounded-md bg-secondary/50 px-3 py-2 text-sm font-medium">{user.email}</p>
        )}
        <div className="flex flex-col gap-2">
          <Button onClick={() => window.location.reload()} className="w-full gold-gradient text-primary-foreground font-semibold">
            Jaǵdaydı jańalaw
          </Button>
          <Button onClick={signOut} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Shıǵıw
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
