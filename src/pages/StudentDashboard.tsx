import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, type Course } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Target, Calendar, Award, ArrowRight, Loader2 } from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { fetchEnrolledCourses, loading } = useCourses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    assignmentsCompleted: 0,
    hoursLearned: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchEnrolledCourses();
    setCourses(data);
    setStats({
      coursesEnrolled: data.length,
      assignmentsCompleted: 0,
      hoursLearned: 0,
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar userType="student" userName={profile?.full_name || "Student"} onLogout={handleLogout} />
      
      <main className="pl-64 transition-all duration-300">
        <Header title={`Welcome back, ${profile?.full_name?.split(" ")[0] || "Student"}! 👋`} subtitle="Continue your learning journey" />
        
        <div className="p-6 space-y-8">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl gradient-primary">
                    <BookOpen className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold">{stats.coursesEnrolled}</p>
                    <p className="text-sm text-muted-foreground">Courses Enrolled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Award className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold">{stats.assignmentsCompleted}</p>
                    <p className="text-sm text-muted-foreground">Assignments Done</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold">{stats.hoursLearned}h</p>
                    <p className="text-sm text-muted-foreground">Hours Learned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Continue Learning */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl font-semibold">Continue Learning</h2>
                  <p className="text-sm text-muted-foreground">Pick up where you left off</p>
                </div>
                <Button variant="outline" onClick={() => navigate("/student/courses")}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : courses.length === 0 ? (
                <Card variant="elevated">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="font-heading text-lg font-semibold mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-4">Start your learning journey by enrolling in a course</p>
                    <Button variant="hero" onClick={() => navigate("/student/courses")}>
                      Browse Courses
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {courses.slice(0, 4).map((course) => (
                    <Card key={course.id} variant="interactive" className="cursor-pointer" onClick={() => navigate(`/student/courses/${course.id}`)}>
                      <CardContent className="pt-6">
                        <Badge variant="secondary" className="mb-2">{course.category || "General"}</Badge>
                        <h3 className="font-heading font-semibold mb-1 line-clamp-1">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">By {course.teacher_name}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{course.progress || 0}%</span>
                          </div>
                          <Progress value={course.progress || 0} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Schedule */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle>Upcoming Schedule</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming events</p>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Goal */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle>Weekly Goal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Complete 5 lessons</span>
                        <span className="font-medium">0/5</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-0 gradient-primary rounded-full transition-all duration-500" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Start learning to track your progress! 🎯
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
