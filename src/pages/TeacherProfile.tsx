import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, BookOpen, Users, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function TeacherProfile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [stats, setStats] = useState({ coursesCreated: 0, totalStudents: 0 });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setBio(profile.bio || "");
    }
  }, [profile]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("teacher_id", user.id);

      const courseIds = (courses || []).map(c => c.id);
      
      const { count: studentCount } = await supabase
        .from("course_enrollments")
        .select("*", { count: "exact", head: true })
        .in("course_id", courseIds.length > 0 ? courseIds : ["none"]);

      setStats({
        coursesCreated: courses?.length || 0,
        totalStudents: studentCount || 0,
      });
    };

    fetchStats();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, bio })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar userType="teacher" userName={profile?.full_name || "Teacher"} onLogout={handleLogout} />
      
      <main className="pl-64 transition-all duration-300">
        <Header title="My Profile" subtitle="Manage your account settings" />
        
        <div className="p-6 max-w-4xl">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Card */}
            <Card variant="elevated" className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl gradient-primary text-primary-foreground">
                      {fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-heading text-lg font-semibold">{fullName}</h3>
                    <p className="text-muted-foreground">Teacher</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={profile?.email || ""}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your students about yourself..."
                    rows={4}
                  />
                </div>

                <Button onClick={handleSave} disabled={loading} variant="hero">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <div className="space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Teaching Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-3xl font-heading font-bold text-primary">{stats.coursesCreated}</p>
                    <p className="text-sm text-muted-foreground">Courses Created</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-3xl font-heading font-bold text-emerald-600">{stats.totalStudents}</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
