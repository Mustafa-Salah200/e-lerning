import { LessonCard, type Lesson } from "./LessonCard";

interface LessonGridProps {
  lessons: Lesson[];
  viewMode?: "student" | "teacher";
  onLessonAction?: (lesson: Lesson) => void;
}

export function LessonGrid({ lessons, viewMode = "student", onLessonAction }: LessonGridProps) {
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-4xl">📚</span>
        </div>
        <h3 className="font-heading text-lg font-semibold mb-2">No lessons found</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          {viewMode === "teacher" 
            ? "Start creating your first lesson to share knowledge with students."
            : "Browse available courses to start your learning journey."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {lessons.map((lesson, index) => (
        <div 
          key={lesson.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <LessonCard 
            lesson={lesson} 
            viewMode={viewMode}
            onAction={onLessonAction}
          />
        </div>
      ))}
    </div>
  );
}
