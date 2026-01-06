import { 
  BookOpen, 
  Users, 
  Clock, 
  TrendingUp,
  Calendar,
  Award,
  Target,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
  color?: "primary" | "secondary" | "accent" | "success" | "warning";
}

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/20 text-amber-600",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
};

export function StatCard({ title, value, change, trend, icon: Icon, color = "primary" }: StatCardProps) {
  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-heading font-bold">{value}</p>
            {change && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend === "up" && "text-emerald-600",
                trend === "down" && "text-red-500",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {trend === "up" && <TrendingUp className="h-3 w-3" />}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  userType: "student" | "teacher";
}

export function DashboardStats({ userType }: DashboardStatsProps) {
  const studentStats: StatCardProps[] = [
    { title: "Lessons Completed", value: 24, change: "+3 this week", trend: "up", icon: BookOpen, color: "primary" },
    { title: "Hours Learned", value: "48h", change: "+5h this week", trend: "up", icon: Clock, color: "accent" },
    { title: "Current Streak", value: "7 days", change: "Best: 14 days", trend: "neutral", icon: Zap, color: "warning" },
    { title: "Achievements", value: 12, change: "+2 new", trend: "up", icon: Award, color: "success" },
  ];

  const teacherStats: StatCardProps[] = [
    { title: "Total Students", value: 156, change: "+12 this month", trend: "up", icon: Users, color: "primary" },
    { title: "Active Lessons", value: 18, change: "2 drafts", trend: "neutral", icon: BookOpen, color: "accent" },
    { title: "Hours Taught", value: "234h", change: "+18h this month", trend: "up", icon: Clock, color: "warning" },
    { title: "Avg. Rating", value: "4.8", change: "Top 10%", trend: "up", icon: Target, color: "success" },
  ];

  const stats = userType === "student" ? studentStats : teacherStats;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div 
          key={stat.title}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <StatCard {...stat} />
        </div>
      ))}
    </div>
  );
}
