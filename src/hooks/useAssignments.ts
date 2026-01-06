import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface AssignmentOption {
  option: string;
  text: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  assignment_type: "file" | "multiple_choice";
  options: AssignmentOption[] | null;
  correct_answer: string | null;
  due_date: string | null;
  max_score: number;
  created_at: string;
  updated_at: string;
  submission?: Submission;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  answer: string | null;
  file_url: string | null;
  file_name: string | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  student_name?: string;
}

function parseOptions(options: Json | null): AssignmentOption[] | null {
  if (!options) return null;
  if (Array.isArray(options)) {
    return options.map(o => ({
      option: String((o as Record<string, unknown>).option || ""),
      text: String((o as Record<string, unknown>).text || ""),
    }));
  }
  return null;
}

export function useAssignments() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCourseAssignments = async (courseId: string) => {
    if (!user) return [];
    setLoading(true);
    try {
      const { data: assignments, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch submissions for student
      const { data: submissions } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", user.id)
        .in("assignment_id", (assignments || []).map(a => a.id));

      const submissionMap = new Map((submissions || []).map(s => [s.assignment_id, s]));

      return (assignments || []).map(a => ({
        ...a,
        assignment_type: a.assignment_type as "file" | "multiple_choice",
        options: parseOptions(a.options),
        submission: submissionMap.get(a.id) as Submission | undefined,
      })) as Assignment[];
    } catch (error: any) {
      toast.error("Failed to fetch assignments");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (
    courseId: string,
    title: string,
    description: string,
    assignmentType: "file" | "multiple_choice",
    options?: AssignmentOption[],
    correctAnswer?: string,
    dueDate?: string,
    maxScore: number = 100
  ) => {
    if (!user) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assignments")
        .insert({
          course_id: courseId,
          title,
          description,
          assignment_type: assignmentType,
          options: options ? (options as unknown as Json) : null,
          correct_answer: correctAnswer || null,
          due_date: dueDate || null,
          max_score: maxScore,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Assignment created successfully!");
      return {
        ...data,
        assignment_type: data.assignment_type as "file" | "multiple_choice",
        options: parseOptions(data.options),
      } as Assignment;
    } catch (error: any) {
      toast.error(error.message || "Failed to create assignment");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const submitAssignment = async (
    assignmentId: string,
    answer?: string,
    file?: File
  ) => {
    if (!user) return false;
    setLoading(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (file) {
        const filePath = `${user.id}/${assignmentId}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("assignment-files")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const { error } = await supabase
        .from("submissions")
        .upsert({
          assignment_id: assignmentId,
          student_id: user.id,
          answer: answer || null,
          file_url: fileUrl,
          file_name: fileName,
          submitted_at: new Date().toISOString(),
        }, {
          onConflict: "assignment_id,student_id",
        });

      if (error) throw error;
      toast.success("Assignment submitted successfully!");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to submit assignment");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentSubmissions = async (assignmentId: string) => {
    setLoading(true);
    try {
      const { data: submissions, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      // Fetch student names
      const studentIds = [...new Set((submissions || []).map(s => s.student_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      return (submissions || []).map(s => ({
        ...s,
        student_name: profileMap.get(s.student_id) || "Unknown",
      })) as Submission[];
    } catch (error: any) {
      toast.error("Failed to fetch submissions");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const gradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          score,
          feedback,
          graded_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      if (error) throw error;
      toast.success("Submission graded successfully!");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to grade submission");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchCourseAssignments,
    createAssignment,
    submitAssignment,
    fetchAssignmentSubmissions,
    gradeSubmission,
  };
}
