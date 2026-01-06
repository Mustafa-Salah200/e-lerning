import { Calendar, Clock, Video, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  duration: string;
  type: "live" | "recorded" | "assignment";
  instructor?: string;
}

interface UpcomingScheduleProps {
  items: ScheduleItem[];
}

export function UpcomingSchedule({ items }: UpcomingScheduleProps) {
  const typeConfig = {
    live: { label: "Live", variant: "destructive" as const, icon: Video },
    recorded: { label: "Video", variant: "secondary" as const, icon: Video },
    assignment: { label: "Assignment", variant: "warning" as const, icon: Clock },
  };

  return (
    <Card variant="elevated">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Upcoming Schedule</CardTitle>
        </div>
        <Button variant="ghost" size="sm">View All</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const config = typeConfig[item.type];
          const TypeIcon = config.icon;
          
          return (
            <div 
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                <TypeIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{item.time}</span>
                  <span>•</span>
                  <span>{item.duration}</span>
                </div>
              </div>
              <Badge variant={config.variant === "destructive" ? "default" : config.variant}>
                {config.label}
              </Badge>
            </div>
          );
        })}
        
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming events</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
