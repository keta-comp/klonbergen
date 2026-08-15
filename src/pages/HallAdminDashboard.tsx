import { motion } from 'framer-motion';
import Navbar from '@/components/common/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FoodMenuManager from '@/components/halladmin/FoodMenuManager';
import ArtistsManager from '@/components/halladmin/ArtistsManager';
import BrideGroomEditor from '@/components/halladmin/BrideGroomEditor';
import QRCodeGenerator from '@/components/halladmin/QRCodeGenerator';
import BannersManager from '@/components/halladmin/BannersManager';
import MomentsManager from '@/components/halladmin/MomentsManager';
import TimelineManager from '@/components/halladmin/TimelineManager';
import { UtensilsCrossed, Music, Heart, QrCode, Image, Camera, Clock } from 'lucide-react';

export default function HallAdminDashboard() {
  const { user, signOut, hallId } = useAuth();

  if (!hallId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="glass rounded-lg p-8 text-center max-w-md">
          <h2 className="text-xl font-bold font-serif mb-2">Kiriw qabıllanǵan joq</h2>
          <p className="text-muted-foreground mb-4">Sizdiń akkauntıńız hesh bir toyxanaǵa jalǵanbaǵan. Super admin sizdi admin etiw kerek.</p>
          <button onClick={signOut} className="text-sm text-primary underline">Shıǵıw</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Vowly — Admin Panel" onLogout={signOut} userName={user?.email ?? ''} />
      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Tabs defaultValue="banners" className="w-full">
            <TabsList className="glass mb-6 w-full justify-start gap-1 flex-wrap">
              <TabsTrigger value="banners" className="flex items-center gap-1"><Image className="h-4 w-4" /> Bannerler</TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-1"><Clock className="h-4 w-4" /> Baǵdarlama</TabsTrigger>
              <TabsTrigger value="food" className="flex items-center gap-1"><UtensilsCrossed className="h-4 w-4" /> Taǵamlar</TabsTrigger>
              <TabsTrigger value="artists" className="flex items-center gap-1"><Music className="h-4 w-4" /> Artistler</TabsTrigger>
              <TabsTrigger value="couple" className="flex items-center gap-1"><Heart className="h-4 w-4" /> Kelin-Kúyew</TabsTrigger>
              <TabsTrigger value="qr" className="flex items-center gap-1"><QrCode className="h-4 w-4" /> QR-Kodlar</TabsTrigger>
              <TabsTrigger value="moments" className="flex items-center gap-1"><Camera className="h-4 w-4" /> Toy sátleri</TabsTrigger>
            </TabsList>
            <TabsContent value="banners"><BannersManager hallId={hallId} /></TabsContent>
            <TabsContent value="timeline"><TimelineManager hallId={hallId} /></TabsContent>
            <TabsContent value="food"><FoodMenuManager hallId={hallId} /></TabsContent>
            <TabsContent value="artists"><ArtistsManager hallId={hallId} /></TabsContent>
            <TabsContent value="couple"><BrideGroomEditor hallId={hallId} /></TabsContent>
            <TabsContent value="qr"><QRCodeGenerator hallId={hallId} /></TabsContent>
            <TabsContent value="moments"><MomentsManager hallId={hallId} /></TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
