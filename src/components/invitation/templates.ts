import type { InvitationTemplate } from '@/hooks/useInvitations';

export interface TemplateStyle {
  id: InvitationTemplate;
  label: string;
  hint: string;
  /** page background */
  page: string;
  /** card surface */
  card: string;
  /** ornament / divider color classes */
  accent: string;
  /** heading classes */
  heading: string;
  /** photo frame */
  frame: string;
  /** small caps label */
  label_cls: string;
  swatch: string;
  /** ambient dust tone */
  tone: 'light' | 'dark';
  /** body text color */
  body: string;
  /** soft inner panel */
  panel: string;
  /** wax seal fill */
  seal: string;
}

export const TEMPLATES: TemplateStyle[] = [
  {
    id: 'luxury',
    label: 'Luxury',
    hint: 'Altın hám kremli, bay kórinis',
    page: 'surface-ivory',
    card: 'bg-[hsl(45_100%_99%)]/92 border border-gold/30 glow-gold-lg backdrop-blur-xl',
    accent: 'text-gold',
    heading: 'text-foil',
    frame: 'ring-1 ring-gold/40 shadow-[0_30px_60px_-30px_hsl(43_74%_42%/0.7)]',
    label_cls: 'text-gold-dark',
    swatch: 'linear-gradient(135deg,#D4AF37,#F1DFA3)',
    tone: 'light',
    body: 'text-[hsl(30_10%_22%)]',
    panel: 'bg-gold/[0.06] border border-gold/20',
    seal: 'hsl(43 74% 45%)',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    hint: 'Ápiwayı, aq keńislik',
    page: 'bg-[hsl(40_20%_97%)]',
    card: 'bg-white border border-[hsl(35_15%_88%)] shadow-[0_40px_90px_-60px_hsl(30_20%_20%/0.5)]',
    accent: 'text-[hsl(30_8%_45%)]',
    heading: 'text-[hsl(30_10%_14%)]',
    frame: 'ring-1 ring-[hsl(35_15%_86%)]',
    label_cls: 'text-[hsl(30_8%_50%)]',
    swatch: 'linear-gradient(135deg,#FFFFFF,#EFEAE1)',
    tone: 'light',
    body: 'text-[hsl(30_8%_30%)]',
    panel: 'bg-[hsl(40_20%_97%)] border border-[hsl(35_15%_90%)]',
    seal: 'hsl(30 8% 40%)',
  },
  {
    id: 'classic',
    label: 'Classic',
    hint: 'Klassik ramka hám serif',
    page: 'bg-[hsl(38_45%_94%)]',
    card: 'bg-[hsl(42_60%_98%)] border-[3px] border-double border-gold/45 shadow-[0_40px_90px_-55px_hsl(38_50%_30%/0.6)]',
    accent: 'text-gold-dark',
    heading: 'text-[hsl(32_28%_20%)]',
    frame: 'ring-2 ring-gold/45',
    label_cls: 'text-gold-dark',
    swatch: 'linear-gradient(135deg,#FBF3E4,#D9C79A)',
    tone: 'light',
    body: 'text-[hsl(32_20%_26%)]',
    panel: 'bg-gold/[0.07] border border-gold/25',
    seal: 'hsl(38 60% 40%)',
  },
  {
    id: 'royal',
    label: 'Royal',
    hint: 'Tereń hám saltanatlı',
    page: 'surface-noir',
    card: 'bg-[hsl(30_14%_13%)]/90 border border-gold/40 text-[hsl(42_60%_95%)] backdrop-blur-xl shadow-[0_60px_140px_-60px_#000]',
    accent: 'text-gold-light',
    heading: 'text-foil',
    frame: 'ring-1 ring-gold/50 shadow-[0_30px_70px_-30px_#000]',
    label_cls: 'text-gold-light',
    swatch: 'linear-gradient(135deg,#221E1A,#D4AF37)',
    tone: 'dark',
    body: 'text-[hsl(42_35%_86%)]',
    panel: 'bg-[hsl(42_60%_95%)]/[0.05] border border-gold/25',
    seal: 'hsl(43 72% 52%)',
  },
  {
    id: 'modern',
    label: 'Modern',
    hint: 'Jumsaq gradient, zamanagóy',
    page: 'bg-[linear-gradient(180deg,hsl(40_60%_97%),hsl(280_30%_96%),hsl(40_60%_97%))]',
    card: 'bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_40px_100px_-50px_hsl(280_30%_40%/0.35)]',
    accent: 'text-gold',
    heading: 'text-[hsl(280_20%_18%)]',
    frame: 'ring-1 ring-white/70 shadow-xl',
    label_cls: 'text-gold-dark',
    swatch: 'linear-gradient(135deg,#FFF8E7,#E7D9F5)',
    tone: 'light',
    body: 'text-[hsl(280_10%_28%)]',
    panel: 'bg-white/60 border border-white/70',
    seal: 'hsl(280 25% 55%)',
  },
];

export function getTemplate(id?: string | null): TemplateStyle {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
