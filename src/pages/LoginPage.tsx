import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PendingApproval from '@/components/auth/PendingApproval';
import { useTranslation } from '@/i18n/LanguageContext';


export default function LoginPage() {
  const { t } = useTranslation();
  const { user, role, approved, loading: authLoading } = useAuth();
  const [pwLoading, setPwLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !user || !approved) return;
    if (role === 'super_admin') navigate('/super-admin', { replace: true });
    else if (role === 'owner') navigate('/admin', { replace: true });
  }, [authLoading, user, role, approved, navigate]);




  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setPwLoading(false);
    if (error) {
      toast.error(t('auth.error'));
      return;
    }
    toast.success(t('auth.success'));
  };

  // Signed in but the super admin has not approved this account yet.
  if (!authLoading && user && !approved) return <PendingApproval />;

  // Approved, but not yet linked to any hall — show a clear message instead of a 404.
  if (!authLoading && user && approved && role === 'guest') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="glass w-full max-w-md rounded-lg p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold font-serif text-gold-gradient">{t('auth.noHallTitle')}</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {t('auth.noHallSub')}
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full gold-gradient text-primary-foreground font-semibold">
              {t('auth.refresh')}
            </Button>
            <Button onClick={() => supabase.auth.signOut()} variant="outline" className="w-full">
              {t('auth.logout')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md rounded-lg p-8 text-center"
      >
        <div className="mb-4 flex justify-center">
          <img src="/logo.png" alt="Vowly" className="h-16 w-auto drop-shadow-md" />
        </div>
        <h1 className="mb-2 text-3xl font-bold font-serif text-gold-gradient">Vowly</h1>
        <p className="mb-6 text-muted-foreground">{t('auth.subtitle')}</p>

        <form onSubmit={handlePasswordLogin} className="space-y-3 text-left">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPh')}
              className="pl-9"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              autoComplete="current-password"
              placeholder={t('auth.passwordPh')}
              className="pl-9"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={pwLoading}
            className="w-full gold-gradient text-primary-foreground font-semibold"
            size="lg"
          >
            {pwLoading ? t('auth.loggingIn') : t('auth.login')}
          </Button>
        </form>

        <div className="mt-6 rounded-lg border border-primary/25 bg-primary/5 px-4 py-4 text-sm">
          <p className="mb-2 font-semibold">{t('auth.noLoginTitle')}</p>
          <p className="mb-3 text-muted-foreground">
            {t('auth.noLoginSub')}
          </p>
          <a
            href="tel:+998777630216"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Phone className="h-4 w-4" /> +998 77 763 02 16
          </a>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('auth.backHome')}
        </button>

      </motion.div>
    </div>
  );
}
