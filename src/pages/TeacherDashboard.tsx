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
import { CreateCourseDialog } from "@/components/courses/CreateCourseDialog";
import { BookOpen, Users, BarChart3, Calendar, ArrowRight, Loader2 } from "lucide-react";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { fetchTeacherCourses, loading } = useCourses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchTeacherCourses();
    setCourses(data);

    // Calculate stats
    const totalStudents = data.reduce((acc, course) => acc + (course.student_count || 0), 0);
    
    setStats({
      totalCourses: data.length,
      totalStudents,
      pendingSubmissions: 0,
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar userType="teacher" userName={profile?.full_name || "Teacher"} onLogout={handleLogout} />
      
      <main className="pl-64 transition-all duration-300">
        <Header title="Teacher Dashboard" subtitle="Manage your courses and students" />
        
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
                    <p className="text-2xl font-heading font-bold">{stats.totalCourses}</p>
                    <p className="text-sm text-muted-foreground">Total Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold">{stats.totalStudents}</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold">{stats.pendingSubmissions}</p>
                    <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* My Courses */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl font-semibold">My Courses</h2>
                  <p className="text-sm text-muted-foreground">Manage and monitor your courses</p>
                </div>
                <CreateCourseDialog onCourseCreated={loadData} />
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
                    <p className="text-muted-foreground mb-4">Create your first course to start teaching</p>
                    <CreateCourseDialog onCourseCreated={loadData} />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {courses.map((course) => (
                    <Card key={course.id} variant="interactive" className="cursor-pointer" onClick={() => navigate(`/teacher/courses/${course.id}`)}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary">{course.category || "General"}</Badge>
                          <Badge variant={course.is_published ? "success" : "warning"}>
                            {course.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <h3 className="font-heading font-semibold mb-1 line-clamp-1">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {course.student_count} students
                          </span>
                          <Button variant="ghost" size="sm" className="gap-1">
                            Manage
                            <ArrowRight className="h-4 w-4" />
                          </Button>
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

              {/* Quick Stats */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle>This Week</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-2xl font-heading font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">New Enrollments</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-2xl font-heading font-bold text-amber-600">-</p>
                      <p className="text-xs text-muted-foreground">Avg. Rating</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-2xl font-heading font-bold text-emerald-600">-</p>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-2xl font-heading font-bold text-sky-600">0</p>
                      <p className="text-xs text-muted-foreground">Questions Asked</p>
                    </div>
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
