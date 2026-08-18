import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props { hallId: string; }

export default function QRCodeGenerator({ hallId }: Props) {
  const [tableCount, setTableCount] = useState(10);
  const [generated, setGenerated] = useState(false);
  const qrRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const { t, locale } = useTranslation();

  // Localized so the guest lands directly on the correct language route
  // (/<locale>/hall/<realId>) and never relies on the legacy redirect.
  const baseUrl = `${window.location.origin}/${locale}/hall/${hallId}`;

  const handleGenerate = () => {
    setGenerated(true);
  };

  const downloadSingle = (tableNum: number) => {
    const canvas = qrRefs.current.get(tableNum);
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (blob) saveAs(blob, `stol-${tableNum}-qr.png`);
    });
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const promises: Promise<void>[] = [];

    for (let i = 1; i <= tableCount; i++) {
      const canvas = qrRefs.current.get(i);
      if (!canvas) continue;
      promises.push(
        new Promise<void>((resolve) => {
          canvas.toBlob(blob => {
            if (blob) zip.file(`stol-${i}-qr.png`, blob);
            resolve();
          });
        })
      );
    }

    await Promise.all(promises);
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `qr-kodlar-${hallId.slice(0, 8)}.zip`);
    toast.success(t('admin.qr.downloaded'));
  };

  const setQrRef = useCallback((tableNum: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      qrRefs.current.set(tableNum, el);
    }
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass mb-6 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif"><QrCode className="h-5 w-5 text-primary" /> {t('admin.qr.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('admin.qr.tableCount')}</label>
            <Input type="number" min={1} max={100} value={tableCount} onChange={e => setTableCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerate} className="gold-gradient text-primary-foreground">{t('admin.qr.generate')}</Button>
            {generated && (
              <Button variant="outline" onClick={downloadAll}><Download className="mr-1 h-4 w-4" /> {t('admin.qr.downloadAll')}</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {generated && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => (
            <motion.div
              key={num}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: num * 0.02 }}
              className="glass rounded-lg p-3 text-center"
            >
              <p className="mb-2 text-sm font-semibold">{t('admin.qr.table')} {num}</p>
              <QRCodeCanvas
                value={`${baseUrl}?table=${num}`}
                size={140}
                level="H"
                includeMargin
                ref={setQrRef(num)}
                className="mx-auto"
              />
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => downloadSingle(num)}>
                <Download className="mr-1 h-3 w-3" /> {t('admin.qr.download')}
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
