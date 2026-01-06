import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { Assignment, Submission } from "@/hooks/useAssignmentsEnhanced";
import type { MCQuestion } from "./CreateAssignmentDialog";

interface StudentAssignmentViewProps {
  assignment: Assignment | null;
  submission?: Submission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (assignmentId: string, data: SubmissionData) => Promise<boolean>;
  loading: boolean;
}

export interface SubmissionData {
  textAnswer?: string;
  answers?: Record<string, string>;
  file?: File;
}

// Shuffle array using Fisher-Yates algorithm with seed
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let m = shuffled.length;
  
  // Simple seeded random
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  
  while (m) {
    const i = Math.floor(random() * m--);
    [shuffled[m], shuffled[i]] = [shuffled[i], shuffled[m]];
  }
  
  return shuffled;
}

export function StudentAssignmentView({
  assignment,
  submission,
  open,
  onOpenChange,
  onSubmit,
  loading,
}: StudentAssignmentViewProps) {
  const [textAnswer, setTextAnswer] = useState("");
  const [mcAnswers, setMcAnswers] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Generate randomized questions and options based on assignment ID + session
  const randomizedQuestions = useMemo(() => {
    if (!assignment?.questions) return [];
    
    // Use assignment ID as part of seed, combined with session timestamp
    const sessionSeed = parseInt(sessionStorage.getItem(`quiz_seed_${assignment.id}`) || String(Date.now()));
    if (!sessionStorage.getItem(`quiz_seed_${assignment.id}`)) {
      sessionStorage.setItem(`quiz_seed_${assignment.id}`, String(sessionSeed));
    }
    
    const questions = assignment.questions as MCQuestion[];
    
    // Shuffle questions order
    const shuffledQuestions = shuffleWithSeed(questions, sessionSeed);
    
    // Shuffle options within each question while tracking correct answer
    return shuffledQuestions.map((q, idx) => {
      const optionSeed = sessionSeed + idx;
      const originalOptions = q.options.map((opt, i) => ({
        ...opt,
        isCorrect: opt.label === q.correctAnswer,
      }));
      
      const shuffledOptions = shuffleWithSeed(originalOptions, optionSeed).map((opt, i) => ({
        ...opt,
        label: String.fromCharCode(65 + i), // Reassign labels A, B, C, D
      }));
      
      const newCorrectAnswer = shuffledOptions.find(o => o.isCorrect)?.label || "A";
      
      return {
        ...q,
        options: shuffledOptions.map(({ isCorrect, ...rest }) => rest),
        correctAnswer: newCorrectAnswer,
        originalId: q.id,
      };
    });
  }, [assignment?.questions, assignment?.id]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && assignment) {
      setTextAnswer("");
      setMcAnswers({});
      setFile(null);
      setCurrentQuestionIndex(0);
      
      // Clear quiz seed on new open to get fresh randomization
      if (!submission) {
        sessionStorage.removeItem(`quiz_seed_${assignment.id}`);
      }
    }
  }, [open, assignment?.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check file size (2MB limit)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      e.target.value = "";
      return;
    }
    
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    
    // Validation
    if (assignment.submission_type === "text" && !textAnswer.trim()) {
      toast.error("Please enter your answer");
      return;
    }
    
    if (assignment.submission_type === "multiple_choice") {
      const unanswered = randomizedQuestions.filter(q => !mcAnswers[q.id]);
      if (unanswered.length > 0) {
        toast.error(`Please answer all questions (${unanswered.length} remaining)`);
        return;
      }
    }
    
    if (assignment.submission_type === "file" && !file) {
      toast.error("Please upload a file");
      return;
    }
    
    setIsSubmitting(true);
    
    const success = await onSubmit(assignment.id, {
      textAnswer: assignment.submission_type === "text" ? textAnswer : undefined,
      answers: assignment.submission_type === "multiple_choice" ? mcAnswers : undefined,
      file: assignment.submission_type === "file" ? file || undefined : undefined,
    });
    
    setIsSubmitting(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const currentQuestion = randomizedQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(mcAnswers).length;
  const progress = randomizedQuestions.length > 0 
    ? (answeredCount / randomizedQuestions.length) * 100 
    : 0;

  if (!assignment) return null;

  // Show graded result
  if (submission?.graded_at) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignment.title}</DialogTitle>
            <DialogDescription>Your submission has been graded</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{submission.score} / {assignment.max_score}</p>
                <p className="text-sm text-muted-foreground">Your Score</p>
              </div>
            </div>
            
            {submission.feedback && (
              <Card>
                <CardContent className="pt-4">
                  <Label className="text-sm text-muted-foreground">Teacher Feedback</Label>
                  <p className="mt-1">{submission.feedback}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show pending status
  if (submission && !submission.graded_at) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignment.title}</DialogTitle>
            <DialogDescription>Awaiting grade</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 text-warning">
              <Clock className="h-8 w-8" />
            </div>
            <div>
              <p className="font-medium">Submission Pending</p>
              <p className="text-sm text-muted-foreground">
                Your teacher hasn't graded this assignment yet
              </p>
            </div>
            {submission.file_name && (
              <Badge variant="secondary">
                <FileText className="h-3 w-3 mr-1" />
                {submission.file_name}
              </Badge>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{assignment.title}</DialogTitle>
          {assignment.description && (
            <DialogDescription>{assignment.description}</DialogDescription>
          )}
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Anti-cheat notice for MC */}
            {assignment.submission_type === "multiple_choice" && (
              <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg text-sm">
                <Shield className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Questions are randomized</p>
                  <p className="text-muted-foreground text-xs">
                    Question order and answer options are shuffled to ensure fair assessment
                  </p>
                </div>
              </div>
            )}
            
            {/* Text submission */}
            {assignment.submission_type === "text" && (
              <div className="space-y-2">
                <Label>Your Answer</Label>
                <Textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={10}
                  className="resize-none"
                />
              </div>
            )}
            
            {/* Multiple choice submission */}
            {assignment.submission_type === "multiple_choice" && randomizedQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    Question {currentQuestionIndex + 1} of {randomizedQuestions.length}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {answeredCount} answered
                  </span>
                </div>
                
                <Progress value={progress} className="h-2" />
                
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <p className="font-medium text-lg">{currentQuestion.title}</p>
                    
                    <RadioGroup 
                      value={mcAnswers[currentQuestion.id] || ""} 
                      onValueChange={(v) => setMcAnswers({ ...mcAnswers, [currentQuestion.id]: v })}
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((opt) => (
                        <div 
                          key={opt.label} 
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer
                            ${mcAnswers[currentQuestion.id] === opt.label 
                              ? "border-primary bg-primary/5" 
                              : "hover:bg-muted/50"}`}
                        >
                          <RadioGroupItem value={opt.label} id={`opt-${currentQuestion.id}-${opt.label}`} />
                          <Label htmlFor={`opt-${currentQuestion.id}-${opt.label}`} className="flex-1 cursor-pointer">
                            <span className="font-medium">{opt.label}.</span> {opt.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
                
                {/* Question navigation */}
                <div className="flex gap-2 flex-wrap">
                  {randomizedQuestions.map((q, idx) => (
                    <Button
                      key={q.id}
                      variant={idx === currentQuestionIndex ? "default" : mcAnswers[q.id] ? "secondary" : "outline"}
                      size="sm"
                      className="w-10 h-10"
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.min(randomizedQuestions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === randomizedQuestions.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            
            {/* File submission */}
            {assignment.submission_type === "file" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">Maximum file size: 2MB</p>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSubmit} 
            disabled={loading || isSubmitting}
            className="w-full" 
            variant="hero"
          >
            {(loading || isSubmitting) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Submit Assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}