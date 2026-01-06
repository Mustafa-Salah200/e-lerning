import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, type Course } from "@/hooks/useCourses";
import { useAssignmentsEnhanced, type Assignment } from "@/hooks/useAssignmentsEnhanced";
import { CreateAssignmentDialog, type AssignmentFormData } from "@/components/assignments/CreateAssignmentDialog";
import { StudentAssignmentView, type SubmissionData } from "@/components/assignments/StudentAssignmentView";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  Upload,
  Loader2,
  ArrowLeft,
  Users,
  ListChecks,
  FileType,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const { fetchCourseById } = useCourses();
  const { fetchCourseAssignments, createAssignment, submitAssignment, loading } = useAssignmentsEnhanced();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadAssignments();
    }
  }, [courseId]);

  const loadCourse = async () => {
    if (!courseId) return;
    const data = await fetchCourseById(courseId);
    setCourse(data);
  };

  const loadAssignments = async () => {
    if (!courseId) return;
    const data = await fetchCourseAssignments(courseId);
    setAssignments(data);
  };

  const handleCreateAssignment = async (data: AssignmentFormData): Promise<boolean> => {
    if (!courseId) return false;
    
    const result = await createAssignment(courseId, data);

    if (result) {
      setShowCreateAssignment(false);
      loadAssignments();
      return true;
    }
    return false;
  };

  const handleSubmitAssignment = async (assignmentId: string, data: SubmissionData): Promise<boolean> => {
    const success = await submitAssignment(assignmentId, data);

    if (success) {
      setShowSubmitDialog(false);
      setSelectedAssignment(null);
      loadAssignments();
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileType className="h-3 w-3" />;
      case "multiple_choice":
        return <ListChecks className="h-3 w-3" />;
      case "file":
      default:
        return <Upload className="h-3 w-3" />;
    }
  };

  const getSubmissionTypeBadge = (type: string) => {
    switch (type) {
      case "text":
        return <Badge variant="secondary"><FileType className="h-3 w-3 mr-1" />Text Answer</Badge>;
      case "multiple_choice":
        return <Badge variant="info"><ListChecks className="h-3 w-3 mr-1" />Multiple Choice</Badge>;
      case "file":
      default:
        return <Badge variant="secondary"><Upload className="h-3 w-3 mr-1" />File Upload</Badge>;
    }
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    if (!assignment.submission) {
      return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Not Submitted</Badge>;
    }
    if (assignment.submission.graded_at) {
      return (
        <Badge variant="success">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {assignment.submission.score}/{assignment.max_score}
        </Badge>
      );
    }
    return (
      <Badge variant="warning">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar 
        userType={role as "student" | "teacher"} 
        userName={profile?.full_name || "User"} 
        onLogout={handleLogout}
      />
      
      <main className="pl-64 transition-all duration-300">
        <Header title={course.title} subtitle={`By ${course.teacher_name}`} />
        
        <div className="p-6 space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Course Info */}
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge variant="secondary">{course.category || "General"}</Badge>
                  <p className="text-muted-foreground max-w-2xl">{course.description}</p>
                  {course.details && (
                    <p className="text-sm text-muted-foreground mt-4">{course.details}</p>
                  )}
                </div>
                {role === "teacher" && (
                  <Button variant="hero" onClick={() => setShowCreateAssignment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assignment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignments List */}
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Assignments ({assignments.length})
            </h2>

            {assignments.length === 0 ? (
              <Card variant="elevated">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} variant="interactive" className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{assignment.title}</h3>
                            {getSubmissionTypeBadge(assignment.submission_type)}
                            {role === "student" && getSubmissionStatus(assignment)}
                          </div>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground">{assignment.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {assignment.due_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due: {format(new Date(assignment.due_date), "PPp")}
                              </span>
                            )}
                            {assignment.questions && (
                              <span className="flex items-center gap-1">
                                <ListChecks className="h-3 w-3" />
                                {assignment.questions.length} questions
                              </span>
                            )}
                            <span>Max Score: {assignment.max_score}</span>
                          </div>
                          {assignment.attachment_url && (
                            <a 
                              href={assignment.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              {assignment.attachment_name || "View Attachment"}
                            </a>
                          )}
                        </div>
                        
                        {role === "student" && (
                          <Button
                            variant={assignment.submission ? "outline" : "hero"}
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowSubmitDialog(true);
                            }}
                          >
                            {assignment.submission ? "View" : "Submit"}
                          </Button>
                        )}
                        
                        {role === "teacher" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignment.id}`)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Submissions
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Assignment Dialog */}
      <CreateAssignmentDialog
        open={showCreateAssignment}
        onOpenChange={setShowCreateAssignment}
        onSubmit={handleCreateAssignment}
        loading={loading}
      />

      {/* Student Assignment View */}
      <StudentAssignmentView
        assignment={selectedAssignment}
        submission={selectedAssignment?.submission}
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onSubmit={handleSubmitAssignment}
        loading={loading}
      />
    </div>
  );
}