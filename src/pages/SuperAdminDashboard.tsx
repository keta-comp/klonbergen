import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/common/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useWeddingHalls, useHallAdmins, useMutateHall, useProfiles } from '@/hooks/useHallData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit2, Users, MapPin, Phone, UserPlus, Building2, CheckCircle2, XCircle, KeyRound, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SuperAdminDashboard() {
  const { user, signOut } = useAuth();
  const { data: halls, isLoading } = useWeddingHalls();
  const { data: allAdmins } = useHallAdmins();
  const { data: profiles } = useProfiles();
  const { create, update, remove } = useMutateHall();
  const qc = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editHall, setEditHall] = useState<any>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [adminOpen, setAdminOpen] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [credOpen, setCredOpen] = useState<string | null>(null);
  const [credForm, setCredForm] = useState({ email: '', password: '', full_name: '' });
  const [credLoading, setCredLoading] = useState(false);
  const [credResult, setCredResult] = useState<{ email: string; password: string } | null>(null);


  // Get users who are NOT already hall admins
  const assignedUserIds = new Set(allAdmins?.map(a => a.user_id) ?? []);
  const availableUsers = profiles?.filter(p => !assignedUserIds.has(p.user_id) && p.user_id !== user?.id && p.approved) ?? [];
  const pendingProfiles = profiles?.filter(p => !p.approved) ?? [];


  const handleCreate = async () => {
    await create.mutateAsync(form);
    setForm({ name: '', address: '', phone: '' });
    setAddOpen(false);
    toast.success('Toyxana qosıldı!');
  };

  const handleUpdate = async () => {
    if (!editHall) return;
    await update.mutateAsync({ id: editHall.id, ...form });
    setEditHall(null);
    setForm({ name: '', address: '', phone: '' });
    toast.success('Toyxana jańalandı!');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Oshiriwdi tastıyqlaysızba?')) return;
    await remove.mutateAsync(id);
    toast.success('Toyxana óshirildi!');
  };

  const genPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const bytes = crypto.getRandomValues(new Uint32Array(10));
    return Array.from(bytes, b => chars[b % chars.length]).join('') + '!7';
  };

  const handleCreateCredentials = async (hallId: string) => {
    setCredLoading(true);
    const { data, error } = await supabase.functions.invoke('create-hall-admin', {
      body: { ...credForm, email: credForm.email.trim(), hall_id: hallId },
    });
    setCredLoading(false);
    const errMsg = error?.message ?? (data as any)?.error;
    if (errMsg) {
      toast.error(errMsg);
      return;
    }
    toast.success('Toyxana admini ushın login jaratıldı!');
    setCredResult({ email: credForm.email.trim(), password: credForm.password });
    setCredForm({ email: '', password: '', full_name: '' });
    qc.invalidateQueries({ queryKey: ['hall_admins'] });
    qc.invalidateQueries({ queryKey: ['profiles'] });
  };


  const handleAddAdmin = async (hallId: string) => {
    const profile = profiles?.find(p => p.user_id === selectedUserId);
    if (!profile) return;

    const { error } = await supabase.from('hall_admins').insert({
      hall_id: hallId,
      email: profile.email || '',
      user_id: profile.user_id,
      full_name: profile.full_name || profile.email || '',
      avatar_url: profile.avatar_url || '',
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Admin qılındı!');
      qc.invalidateQueries({ queryKey: ['hall_admins'] });
      setSelectedUserId('');
      setAdminOpen(null);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    const { error } = await supabase.from('hall_admins').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Admin óshirildi!');
      qc.invalidateQueries({ queryKey: ['hall_admins'] });
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved, approved_at: approved ? new Date().toISOString() : null })
      .eq('user_id', userId);
    if (error) toast.error(error.message);
    else {
      toast.success(approved ? 'Paydalanıwshı tastıyıqlandı!' : 'Tastıyıqlaw biykar etildi');
      qc.invalidateQueries({ queryKey: ['profiles'] });
    }
  };


  const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Vowly — Super Admin" onLogout={signOut} userName={user?.email ?? ''} />
      <main className="container py-8">
        <Tabs defaultValue="halls">
          <TabsList className="glass mb-6">
            <TabsTrigger value="halls" className="flex items-center gap-1"><Building2 className="h-4 w-4" /> Toyxanalar</TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1"><Users className="h-4 w-4" /> Dizimnen ótkenler</TabsTrigger>
          </TabsList>

          <TabsContent value="halls">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold font-serif">Bárshe toyxanalar</h2>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gold-gradient text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> Qosıw</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-serif">Jańadan toyxana qosıw</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Toyxana atı" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <Input placeholder="Mánzil" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                    <Input placeholder="Telefon" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    <Button onClick={handleCreate} disabled={!form.name || create.isPending} className="w-full gold-gradient text-primary-foreground">
                      {create.isPending ? 'Saqlanıwda...' : 'Saqlaw'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Toyxana admini ushın login/parol jaratıw */}
            <Dialog open={!!credOpen} onOpenChange={v => { if (!v) { setCredOpen(null); setCredResult(null); } }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif">Admin ushın login hám parol jaratıw</DialogTitle>
                </DialogHeader>
                {credResult ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Bul maǵlıwmatlardı toyxana adminine beriń. Ol usı login menen tuwrıdan-tuwrı kire aladı.
                    </p>
                    <div className="rounded-md bg-secondary/60 p-3 text-sm">
                      <p><span className="text-muted-foreground">Login:</span> <b>{credResult.email}</b></p>
                      <p><span className="text-muted-foreground">Parol:</span> <b>{credResult.password}</b></p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(`Login: ${credResult.email}\nParol: ${credResult.password}`);
                        toast.success('Kóshirildi');
                      }}
                    >
                      <Copy className="mr-1 h-4 w-4" /> Kóshirip alıw
                    </Button>
                    <Button className="w-full gold-gradient text-primary-foreground" onClick={() => { setCredOpen(null); setCredResult(null); }}>
                      Jabıw
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="Admin atı (májbúriy emes)"
                      value={credForm.full_name}
                      onChange={e => setCredForm(f => ({ ...f, full_name: e.target.value }))}
                    />
                    <Input
                      type="email"
                      placeholder="Login (email)"
                      value={credForm.email}
                      onChange={e => setCredForm(f => ({ ...f, email: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Parol"
                        value={credForm.password}
                        onChange={e => setCredForm(f => ({ ...f, password: e.target.value }))}
                      />
                      <Button variant="outline" size="icon" onClick={() => setCredForm(f => ({ ...f, password: genPassword() }))}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      className="w-full gold-gradient text-primary-foreground"
                      disabled={!credForm.email || credForm.password.length < 6 || credLoading}
                      onClick={() => credOpen && handleCreateCredentials(credOpen)}
                    >
                      {credLoading ? 'Jaratılmaqta...' : 'Jaratıw hám toyxanaǵa biriktiriw'}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>


            <Dialog open={!!editHall} onOpenChange={v => { if (!v) setEditHall(null); }}>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-serif">Toyxana o'zgertiw</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Toyxona atı" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <Input placeholder="Manzil" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  <Input placeholder="Telefon" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  <Button onClick={handleUpdate} disabled={!form.name || update.isPending} className="w-full gold-gradient text-primary-foreground">
                    {update.isPending ? 'Saqlanıwda...' : 'Saqlaw'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {halls?.map(hall => (
                <motion.div key={hall.id} variants={item}>
                  <Card className="glass overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between font-serif text-lg">
                        {hall.name}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditHall(hall); setForm({ name: hall.name, address: hall.address ?? '', phone: hall.phone ?? '' }); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(hall.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {hall.address && <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" />{hall.address}</p>}
                      {hall.phone && <p className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-3 w-3" />{hall.phone}</p>}
                      <div className="mt-3 border-t pt-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-medium flex items-center gap-1"><Users className="h-3 w-3" />Adminler</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="gold-gradient text-primary-foreground"
                              onClick={() => { setCredResult(null); setCredForm({ email: '', password: genPassword(), full_name: '' }); setCredOpen(hall.id); }}
                            >
                              <KeyRound className="mr-1 h-3 w-3" /> Login jaratıw
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setAdminOpen(hall.id)}>
                              <UserPlus className="mr-1 h-3 w-3" /> Tayınlaw
                            </Button>
                          </div>
                        </div>

                        {allAdmins?.filter(a => a.hall_id === hall.id).map(admin => (
                          <div key={admin.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-2 py-1.5 text-sm mb-1">
                            <div className="flex items-center gap-2">
                              {admin.avatar_url && <img src={admin.avatar_url} alt="" className="h-6 w-6 rounded-full" />}
                              <div>
                                <p className="font-medium text-xs">{admin.full_name || admin.email}</p>
                                <p className="text-xs text-muted-foreground">{admin.email}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveAdmin(admin.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        {(!allAdmins || allAdmins.filter(a => a.hall_id === hall.id).length === 0) && (
                          <p className="text-xs text-muted-foreground italic">Házirshe admin joq</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="users">
            <h2 className="mb-1 text-2xl font-bold font-serif">Google orqalı ro'yxattan ótkenler</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Jańa paydalanıwshı tek siz tastıyıqlaǵannan keyin sistemaǵa kire aladı.
            </p>
            {pendingProfiles.length > 0 && (
              <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                {pendingProfiles.length} paydalanıwshı tastıyıqlawdı kútpekte
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profiles?.map(profile => {
                const isAdmin = assignedUserIds.has(profile.user_id);
                const adminHall = allAdmins?.find(a => a.user_id === profile.user_id);
                const hallName = adminHall ? halls?.find(h => h.id === adminHall.hall_id)?.name : null;
                const isSelf = profile.user_id === user?.id;
                return (
                  <Card key={profile.id} className="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {profile.avatar_url && <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{profile.full_name || 'Atı joq'}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            profile.approved ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {profile.approved ? '✓ Tastıyıqlanǵan' : '⏳ Kútpekte'}
                        </span>
                      </div>

                      {isAdmin ? (
                        <div className="mt-2 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary font-medium">
                          ✓ Admin: {hallName || 'Toyxana'}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground italic">Házirshe tayınlanbag'an</p>
                      )}

                      {!isSelf && (
                        <div className="mt-3">
                          {profile.approved ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleApproval(profile.user_id, false)}
                            >
                              <XCircle className="mr-1 h-3 w-3" /> Ruqsattı biykar etiw
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full gold-gradient text-primary-foreground"
                              onClick={() => handleApproval(profile.user_id, true)}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Tastıyıqlaw
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {(!profiles || profiles.length === 0) && (
                <p className="text-muted-foreground col-span-full text-center py-8">Házirshe hesh kim dizimnen ótpegen</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Assign Admin Dialog */}
        <Dialog open={!!adminOpen} onOpenChange={v => { if (!v) { setAdminOpen(null); setSelectedUserId(''); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Admin tayınlaw</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Google orqalı kirgen paydalanıwshılar diziminen tańlań:</p>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Paydalanıwshı tańlań" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      <div className="flex items-center gap-2">
                        {p.avatar_url && <img src={p.avatar_url} alt="" className="h-5 w-5 rounded-full" />}
                        <span>{p.full_name || p.email}</span>
                        <span className="text-muted-foreground text-xs">({p.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Tayınlaw ushın paydalanıwshı joq. Aldın Google menen kiriw kerek.</p>
              )}
              <Button
                onClick={() => adminOpen && handleAddAdmin(adminOpen)}
                disabled={!selectedUserId}
                className="w-full gold-gradient text-primary-foreground"
              >
                Tayınlaw
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
