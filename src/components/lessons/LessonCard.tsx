import { 
  BookOpen, 
  Clock, 
  Users, 
  Play, 
  CheckCircle2,
  Star,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  instructor?: string;
  studentsCount?: number;
  category: string;
  status: "not_started" | "in_progress" | "completed";
  progress?: number;
  rating?: number;
  thumbnail?: string;
}

interface LessonCardProps {
  lesson: Lesson;
  viewMode?: "student" | "teacher";
  onAction?: (lesson: Lesson) => void;
}

export function LessonCard({ lesson, viewMode = "student", onAction }: LessonCardProps) {
  const statusConfig = {
    not_started: { label: "New", variant: "info" as const, icon: BookOpen },
    in_progress: { label: "In Progress", variant: "warning" as const, icon: Play },
    completed: { label: "Completed", variant: "success" as const, icon: CheckCircle2 },
  };

  const status = statusConfig[lesson.status];
  const StatusIcon = status.icon;

  return (
    <Card variant="interactive" className="group overflow-hidden">
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="h-16 w-16 text-primary/30" />
        </div>
        <div className="absolute top-3 left-3">
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        {lesson.progress !== undefined && lesson.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div 
              className="h-full gradient-primary transition-all duration-500"
              style={{ width: `${lesson.progress}%` }}
            />
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-xs">
            {lesson.category}
          </Badge>
          {lesson.rating && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-medium">{lesson.rating}</span>
            </div>
          )}
        </div>
        <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
          {lesson.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {lesson.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{lesson.duration}</span>
          </div>
          {viewMode === "teacher" && lesson.studentsCount !== undefined && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{lesson.studentsCount} students</span>
            </div>
          )}
          {viewMode === "student" && lesson.instructor && (
            <span className="truncate">by {lesson.instructor}</span>
          )}
        </div>

        <Button 
          variant={lesson.status === "completed" ? "outline" : "hero"}
          className="w-full"
          onClick={() => onAction?.(lesson)}
        >
          {viewMode === "teacher" ? (
            <>Manage Lesson</>
          ) : lesson.status === "completed" ? (
            <>Review Lesson</>
          ) : lesson.status === "in_progress" ? (
            <>Continue Learning</>
          ) : (
            <>Start Lesson</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
