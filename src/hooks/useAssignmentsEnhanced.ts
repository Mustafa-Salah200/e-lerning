import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import type { AssignmentFormData, MCQuestion } from "@/components/assignments/CreateAssignmentDialog";
import type { SubmissionData } from "@/components/assignments/StudentAssignmentView";

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  assignment_type: string;
  submission_type: "text" | "multiple_choice" | "file";
  questions: MCQuestion[] | null;
  options: { option: string; text: string }[] | null;
  correct_answer: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
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
  answers: Record<string, string> | null;
  file_url: string | null;
  file_name: string | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  student_name?: string;
}

function parseQuestions(data: Json | null): MCQuestion[] | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.map(q => ({
      id: String((q as Record<string, unknown>).id || crypto.randomUUID()),
      title: String((q as Record<string, unknown>).title || ""),
      options: ((q as Record<string, unknown>).options as { label: string; text: string }[]) || [],
      correctAnswer: String((q as Record<string, unknown>).correctAnswer || "A"),
    }));
  }
  return null;
}

function parseAnswers(data: Json | null): Record<string, string> | null {
  if (!data) return null;
  if (typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, string>;
  }
  return null;
}

export function useAssignmentsEnhanced() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCourseAssignments = async (courseId: string): Promise<Assignment[]> => {
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

      const submissionMap = new Map((submissions || []).map(s => [s.assignment_id, {
        ...s,
        answers: parseAnswers(s.answers),
      }]));

      return (assignments || []).map(a => ({
        ...a,
        submission_type: (a.submission_type || a.assignment_type || "file") as "text" | "multiple_choice" | "file",
        questions: parseQuestions(a.questions),
        submission: submissionMap.get(a.id) as Submission | undefined,
      })) as Assignment[];
    } catch (error: any) {
      toast.error("Failed to fetch assignments");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (courseId: string, data: AssignmentFormData): Promise<Assignment | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;

      // Upload attachment if provided
      if (data.attachmentFile) {
        const filePath = `attachments/${courseId}/${Date.now()}_${data.attachmentFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, data.attachmentFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("assignment-files")
          .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
        attachmentName = data.attachmentFile.name;
      }

      const { data: created, error } = await supabase
        .from("assignments")
        .insert({
          course_id: courseId,
          title: data.title,
          description: data.description || null,
          assignment_type: data.submissionType,
          submission_type: data.submissionType,
          questions: data.questions ? (data.questions as unknown as Json) : null,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          due_date: data.dueDate || null,
          max_score: data.maxScore,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Assignment created successfully!");
      
      return {
        ...created,
        submission_type: created.submission_type as "text" | "multiple_choice" | "file",
        questions: parseQuestions(created.questions),
      } as Assignment;
    } catch (error: any) {
      toast.error(error.message || "Failed to create assignment");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const submitAssignment = async (assignmentId: string, data: SubmissionData): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (data.file) {
        const filePath = `submissions/${user.id}/${assignmentId}/${Date.now()}_${data.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(filePath, data.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("assignment-files")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = data.file.name;
      }

      const { error } = await supabase
        .from("submissions")
        .upsert({
          assignment_id: assignmentId,
          student_id: user.id,
          answer: data.textAnswer || null,
          answers: data.answers ? (data.answers as unknown as Json) : null,
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

  const fetchAssignmentSubmissions = async (assignmentId: string): Promise<Submission[]> => {
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
        answers: parseAnswers(s.answers),
        student_name: profileMap.get(s.student_id) || "Unknown",
      })) as Submission[];
    } catch (error: any) {
      toast.error("Failed to fetch submissions");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const gradeSubmission = async (submissionId: string, score: number, feedback: string): Promise<boolean> => {
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

  const fetchAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", assignmentId)
        .single();

      if (error) throw error;

      return {
        ...data,
        submission_type: (data.submission_type || data.assignment_type || "file") as "text" | "multiple_choice" | "file",
        questions: parseQuestions(data.questions),
      } as Assignment;
    } catch (error: any) {
      toast.error("Failed to fetch assignment");
      return null;
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
    fetchAssignmentById,
  };
}