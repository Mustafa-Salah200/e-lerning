import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="font-heading text-xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-48"
          />
        </div>
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </Button>
      </div>
    </header>
  );
}
