import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, ZoomIn, Check, X } from 'lucide-react';

interface Props {
  open: boolean;
  imageSrc: string;
  aspect?: number;
  onClose: () => void;
  onComplete: (blob: Blob) => void;
}

async function getCroppedImg(imageSrc: string, crop: Area, rotation: number): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(radians);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const scaleX = bBoxWidth / image.width;
  const scaleY = bBoxHeight / image.height;

  const data = ctx.getImageData(
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY
  );

  canvas.width = crop.width;
  canvas.height = crop.height;

  const finalCtx = canvas.getContext('2d')!;
  finalCtx.putImageData(
    data,
    0, 0,
    0, 0,
    crop.width, crop.height
  );

  // Scale down to reasonable size
  const maxDim = 1200;
  if (canvas.width > maxDim || canvas.height > maxDim) {
    const scale = maxDim / Math.max(canvas.width, canvas.height);
    const outCanvas = document.createElement('canvas');
    outCanvas.width = canvas.width * scale;
    outCanvas.height = canvas.height * scale;
    const outCtx = outCanvas.getContext('2d')!;
    outCtx.drawImage(canvas, 0, 0, outCanvas.width, outCanvas.height);
    return new Promise(resolve => outCanvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9));
  }

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9));
}

export default function ImageCropDialog({ open, imageSrc, aspect = 1, onClose, onComplete }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedArea, rotation);
      onComplete(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="font-serif">Suwretti qırqıw ha'm ózgertiw</DialogTitle>
        </DialogHeader>

        <div className="relative h-72 w-full bg-black/90">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={v => setZoom(v[0])}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <RotateCw className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={v => setRotation(v[0])}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}><X className="mr-1 h-4 w-4" /> Biykar etiw</Button>
            <Button onClick={handleConfirm} disabled={processing} className="gold-gradient text-primary-foreground">
              <Check className="mr-1 h-4 w-4" /> {processing ? 'Tayarlanıwda...' : 'Tastıyıqlaw'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
