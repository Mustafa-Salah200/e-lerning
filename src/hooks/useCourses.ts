import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Course {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  details: string | null;
  category: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  teacher_name?: string;
  student_count?: number;
  is_enrolled?: boolean;
  progress?: number;
}

export function useCourses() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchTeacherCourses = async () => {
    if (!user) return [];
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch enrollment counts separately
      const courseIds = (data || []).map(c => c.id);
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .in("course_id", courseIds);

      const countMap = new Map<string, number>();
      (enrollments || []).forEach(e => {
        countMap.set(e.course_id, (countMap.get(e.course_id) || 0) + 1);
      });

      return (data || []).map(course => ({
        ...course,
        student_count: countMap.get(course.id) || 0,
      })) as Course[];
    } catch (error: any) {
      toast.error("Failed to fetch courses");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    if (!user) return [];
    setLoading(true);
    try {
      const { data: courses, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch teacher names
      const teacherIds = [...new Set((courses || []).map(c => c.teacher_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", teacherIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      // Check enrollments
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      const enrolledIds = new Set((enrollments || []).map(e => e.course_id));

      // Get enrollment counts
      const courseIds = (courses || []).map(c => c.id);
      const { data: allEnrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .in("course_id", courseIds);

      const countMap = new Map<string, number>();
      (allEnrollments || []).forEach(e => {
        countMap.set(e.course_id, (countMap.get(e.course_id) || 0) + 1);
      });

      return (courses || []).map(course => ({
        ...course,
        teacher_name: profileMap.get(course.teacher_id) || "Unknown",
        student_count: countMap.get(course.id) || 0,
        is_enrolled: enrolledIds.has(course.id),
      })) as Course[];
    } catch (error: any) {
      toast.error("Failed to fetch courses");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    if (!user) return [];
    setLoading(true);
    try {
      const { data: enrollments, error } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("student_id", user.id)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;

      const courseIds = (enrollments || []).map(e => e.course_id);
      if (courseIds.length === 0) return [];

      const { data: courses } = await supabase
        .from("courses")
        .select("*")
        .in("id", courseIds);

      // Fetch teacher names
      const teacherIds = [...new Set((courses || []).map(c => c.teacher_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", teacherIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));
      const progressMap = new Map((enrollments || []).map(e => [e.course_id, e.progress]));

      return (courses || []).map(course => ({
        ...course,
        teacher_name: profileMap.get(course.teacher_id) || "Unknown",
        progress: progressMap.get(course.id) || 0,
        is_enrolled: true,
      })) as Course[];
    } catch (error: any) {
      toast.error("Failed to fetch enrolled courses");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (title: string, description: string, details: string, category: string) => {
    if (!user) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .insert({
          teacher_id: user.id,
          title,
          description,
          details,
          category,
          is_published: true,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Course created successfully!");
      return data as Course;
    } catch (error: any) {
      toast.error(error.message || "Failed to create course");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!user) return false;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          course_id: courseId,
          student_id: user.id,
        });

      if (error) throw error;
      toast.success("Successfully enrolled in course!");
      return true;
    } catch (error: any) {
      if (error.message.includes("duplicate")) {
        toast.error("You're already enrolled in this course");
      } else {
        toast.error(error.message || "Failed to enroll");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseById = async (courseId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) throw error;

      // Fetch teacher name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", data.teacher_id)
        .maybeSingle();

      return {
        ...data,
        teacher_name: profile?.full_name || "Unknown",
      } as Course;
    } catch (error: any) {
      toast.error("Failed to fetch course");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchTeacherCourses,
    fetchAvailableCourses,
    fetchEnrolledCourses,
    createCourse,
    enrollInCourse,
    fetchCourseById,
  };
}
