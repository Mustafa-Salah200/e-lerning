import { Link, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  LayoutDashboard,
  Calendar,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
}

const studentNavItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/student" },
  { title: "Browse Courses", icon: BookOpen, href: "/student/courses" },
  { title: "My Profile", icon: Settings, href: "/student/profile" },
];

const teacherNavItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/teacher" },
  { title: "My Profile", icon: Settings, href: "/teacher/profile" },
];

interface SidebarProps {
  userType: "student" | "teacher";
  userName: string;
  userAvatar?: string;
  onLogout?: () => void;
}

export function AppSidebar({ userType, userName, userAvatar, onLogout }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  const navItems = userType === "student" ? studentNavItems : teacherNavItems;
  
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">EduLearn</span>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary mx-auto">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border p-4">
        <div className={cn(
          "flex items-center gap-3 rounded-xl p-3 bg-muted/50",
          collapsed && "justify-center p-2"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-secondary text-secondary-foreground font-semibold">
            {userAvatar || userName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-medium text-sm">{userName}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">{userType}</p>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          className={cn("mt-3 w-full justify-start gap-3 text-muted-foreground", collapsed && "justify-center")}
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Log out</span>}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-soft hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
