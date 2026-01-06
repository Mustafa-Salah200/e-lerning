import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, type Course } from "@/hooks/useCourses";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, ArrowRight, Loader2 } from "lucide-react";

export default function BrowseCourses() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { fetchAvailableCourses, enrollInCourse, loading } = useCourses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const data = await fetchAvailableCourses();
    setCourses(data);
  };

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    const success = await enrollInCourse(courseId);
    if (success) {
      loadCourses();
    }
    setEnrolling(null);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar userType="student" userName={profile?.full_name || "Student"} onLogout={handleLogout} />
      
      <main className="transition-all duration-300 md:pl-64">
        <Header title="Browse Courses" subtitle="Discover new courses to learn" />
        
        <div className="p-6">
          {loading && courses.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <Card variant="elevated">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No courses available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} variant="interactive" className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">{course.category || "General"}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {course.student_count}
                      </div>
                    </div>
                    <CardTitle className="mt-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end pt-0">
                    <p className="text-sm text-muted-foreground mb-4">By {course.teacher_name}</p>
                    {course.is_enrolled ? (
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                      >
                        Continue Learning
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        variant="hero" 
                        className="w-full"
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling === course.id}
                      >
                        {enrolling === course.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Enroll Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
