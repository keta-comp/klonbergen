import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  title: string;
  onLogout?: () => void;
  userName?: string;
}

export default function Navbar({ title, onLogout, userName }: NavbarProps) {
  return (
    <header className="glass sticky top-0 z-50 border-b">
      <div className="container flex h-16 items-center justify-between">
        <h1 className="text-xl font-bold font-serif text-gold-gradient">{title}</h1>
        <div className="flex items-center gap-3">
          {userName && <span className="text-sm text-muted-foreground">{userName}</span>}
          {onLogout && (
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="mr-1 h-4 w-4" /> Shıgıw
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
