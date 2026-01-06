import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignmentsEnhanced, type Submission, type Assignment } from "@/hooks/useAssignmentsEnhanced";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Star,
  ListChecks,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { MCQuestion } from "@/components/assignments/CreateAssignmentDialog";

export default function AssignmentSubmissions() {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { fetchAssignmentById, fetchAssignmentSubmissions, gradeSubmission, loading } = useAssignmentsEnhanced();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showGradeDialog, setShowGradeDialog] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      loadData();
    }
  }, [assignmentId]);

  const loadData = async () => {
    if (!assignmentId) return;

    const assignmentData = await fetchAssignmentById(assignmentId);
    setAssignment(assignmentData);

    const subs = await fetchAssignmentSubmissions(assignmentId);
    setSubmissions(subs);
  };

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    
    const success = await gradeSubmission(
      selectedSubmission.id,
      parseInt(score) || 0,
      feedback
    );

    if (success) {
      setShowGradeDialog(false);
      setSelectedSubmission(null);
      setScore("");
      setFeedback("");
      loadData();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getQuestionById = (questionId: string): MCQuestion | undefined => {
    if (!assignment?.questions) return undefined;
    return assignment.questions.find(q => q.id === questionId);
  };

  const renderMCAnswers = (submission: Submission) => {
    if (!submission.answers || !assignment?.questions) return null;

    return (
      <div className="space-y-3 mt-4">
        <Label className="text-sm font-medium">Answers:</Label>
        {Object.entries(submission.answers).map(([questionId, selectedAnswer]) => {
          const question = getQuestionById(questionId);
          if (!question) return null;

          const isCorrect = selectedAnswer === question.correctAnswer;
          const selectedOption = question.options.find(o => o.label === selectedAnswer);

          return (
            <div key={questionId} className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-sm font-medium">{question.title}</p>
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm">
                  Selected: <strong>{selectedAnswer}</strong> - {selectedOption?.text || "Unknown"}
                </span>
              </div>
              {!isCorrect && (
                <p className="text-xs text-muted-foreground">
                  Correct answer: {question.correctAnswer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const calculateMCScore = (submission: Submission): { correct: number; total: number } => {
    if (!submission.answers || !assignment?.questions) return { correct: 0, total: 0 };

    let correct = 0;
    const total = assignment.questions.length;

    Object.entries(submission.answers).forEach(([questionId, selectedAnswer]) => {
      const question = getQuestionById(questionId);
      if (question && selectedAnswer === question.correctAnswer) {
        correct++;
      }
    });

    return { correct, total };
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar userType="teacher" userName={profile?.full_name || "Teacher"} onLogout={handleLogout} />
      
      <main className="pl-64 transition-all duration-300">
        <Header 
          title={assignment?.title || "Assignment"} 
          subtitle="Review and grade submissions" 
        />
        
        <div className="p-6 space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate(`/teacher/courses/${courseId}`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Button>

          {/* Assignment Info */}
          {assignment && (
            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={assignment.submission_type === "multiple_choice" ? "info" : "secondary"}>
                      {assignment.submission_type === "multiple_choice" && <ListChecks className="h-3 w-3 mr-1" />}
                      {assignment.submission_type.replace("_", " ")}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Max Score: {assignment.max_score}</span>
                  </div>
                  {assignment.description && (
                    <p className="text-muted-foreground">{assignment.description}</p>
                  )}
                  {assignment.questions && (
                    <p className="text-sm text-muted-foreground">
                      {assignment.questions.length} questions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submissions List */}
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">
              Submissions ({submissions.length})
            </h2>

            {submissions.length === 0 ? (
              <Card variant="elevated">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No submissions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => {
                  const mcScore = assignment?.submission_type === "multiple_choice" 
                    ? calculateMCScore(submission) 
                    : null;

                  return (
                    <Card key={submission.id} variant="interactive">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <p className="font-medium">{submission.student_name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Submitted: {format(new Date(submission.submitted_at), "PPp")}
                            </p>
                            
                            {/* File submission */}
                            {submission.file_url && (
                              <a 
                                href={submission.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary flex items-center gap-1 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {submission.file_name || "View File"}
                              </a>
                            )}
                            
                            {/* Text answer */}
                            {submission.answer && (
                              <div className="p-3 rounded-lg bg-muted/50 mt-2">
                                <Label className="text-xs text-muted-foreground">Text Answer:</Label>
                                <p className="text-sm mt-1 whitespace-pre-wrap">{submission.answer}</p>
                              </div>
                            )}
                            
                            {/* MC score summary */}
                            {mcScore && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={mcScore.correct === mcScore.total ? "success" : "secondary"}>
                                  {mcScore.correct}/{mcScore.total} correct
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 ml-4">
                            {submission.graded_at ? (
                              <div className="text-right">
                                <Badge variant="success" className="mb-1">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Graded
                                </Badge>
                                <p className="text-lg font-bold text-primary">
                                  {submission.score}/{assignment?.max_score || 100}
                                </p>
                              </div>
                            ) : (
                              <Button
                                variant="hero"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  // Auto-calculate score for MC
                                  if (mcScore && assignment) {
                                    const autoScore = Math.round((mcScore.correct / mcScore.total) * assignment.max_score);
                                    setScore(autoScore.toString());
                                  } else {
                                    setScore(submission.score?.toString() || "");
                                  }
                                  setFeedback(submission.feedback || "");
                                  setShowGradeDialog(true);
                                }}
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Grade
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Grade Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Review and grade this submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Student: <span className="font-medium text-foreground">{selectedSubmission.student_name}</span>
                </p>
                
                {/* Text answer */}
                {selectedSubmission.answer && (
                  <div className="p-3 rounded-lg bg-muted">
                    <Label className="text-xs text-muted-foreground">Text Answer:</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedSubmission.answer}</p>
                  </div>
                )}

                {/* File link */}
                {selectedSubmission.file_url && (
                  <a 
                    href={selectedSubmission.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {selectedSubmission.file_name || "View Submitted File"}
                  </a>
                )}

                {/* MC Answers Review */}
                {assignment?.submission_type === "multiple_choice" && renderMCAnswers(selectedSubmission)}

                <div className="space-y-2 pt-4 border-t">
                  <Label>Score (out of {assignment?.max_score || 100})</Label>
                  <Input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Enter score"
                    min={0}
                    max={assignment?.max_score || 100}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Feedback</Label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback for the student..."
                    rows={4}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          
          <div className="pt-4 border-t">
            <Button onClick={handleGrade} disabled={loading || !score} className="w-full" variant="hero">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Submit Grade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}