import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Loader2,
  Upload,
  ListChecks,
  FileText,
  Trash2,
  FileJson,
  Info,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface MCQuestion {
  id: string;
  title: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
}

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AssignmentFormData) => Promise<boolean>;
  loading: boolean;
}

export interface AssignmentFormData {
  title: string;
  description: string;
  submissionType: "text" | "multiple_choice" | "file";
  questions?: MCQuestion[];
  attachmentFile?: File;
  dueDate?: string;
  maxScore: number;
}

const JSON_EXAMPLE = `[
  {
    "title": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": "B"
  },
  {
    "title": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": "C"
  }
]`;

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: CreateAssignmentDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submissionType, setSubmissionType] = useState<"text" | "multiple_choice" | "file">("file");
  const [questions, setQuestions] = useState<MCQuestion[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [mcInputMode, setMcInputMode] = useState<"manual" | "json">("manual");
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const addQuestion = () => {
    const newQuestion: MCQuestion = {
      id: crypto.randomUUID(),
      title: "",
      options: [
        { label: "A", text: "" },
        { label: "B", text: "" },
        { label: "C", text: "" },
        { label: "D", text: "" },
      ],
      correctAnswer: "A",
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<MCQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const updateQuestionOption = (questionId: string, optionIndex: number, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = { ...newOptions[optionIndex], text };
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const parseJsonQuestions = (json: string): MCQuestion[] | null => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array");
      }

      return parsed.map((item, index) => {
        if (!item.title || !Array.isArray(item.options) || item.options.length !== 4 || !item.correctAnswer) {
          throw new Error(`Question ${index + 1} is missing required fields`);
        }
        
        const validAnswers = ["A", "B", "C", "D"];
        if (!validAnswers.includes(item.correctAnswer.toUpperCase())) {
          throw new Error(`Question ${index + 1} has invalid correctAnswer. Must be A, B, C, or D`);
        }

        return {
          id: crypto.randomUUID(),
          title: item.title,
          options: item.options.map((text: string, i: number) => ({
            label: String.fromCharCode(65 + i),
            text: String(text),
          })),
          correctAnswer: item.correctAnswer.toUpperCase(),
        };
      });
    } catch (e: any) {
      setJsonError(e.message);
      return null;
    }
  };

  const handleJsonImport = () => {
    setJsonError("");
    const parsed = parseJsonQuestions(jsonInput);
    if (parsed) {
      setQuestions(parsed);
      setMcInputMode("manual");
      toast.success(`Imported ${parsed.length} questions successfully`);
    }
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setJsonError("");
      const parsed = parseJsonQuestions(content);
      if (parsed) {
        setQuestions(parsed);
        setMcInputMode("manual");
        toast.success(`Imported ${parsed.length} questions from file`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (submissionType === "multiple_choice" && questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    const success = await onSubmit({
      title,
      description,
      submissionType,
      questions: submissionType === "multiple_choice" ? questions : undefined,
      attachmentFile: attachmentFile || undefined,
      dueDate: dueDate || undefined,
      maxScore,
    });

    if (success) {
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSubmissionType("file");
    setQuestions([]);
    setAttachmentFile(null);
    setDueDate("");
    setMaxScore(100);
    setMcInputMode("manual");
    setJsonInput("");
    setJsonError("");
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setAttachmentFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>
            Create an assignment for your students
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="space-y-6 py-4 px-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Assignment title"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description / Instructions</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the assignment, provide instructions..."
                  rows={4}
                />
              </div>

              {/* Attachment Upload */}
              <div className="space-y-2">
                <Label>Attachment (optional)</Label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleAttachmentUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  {attachmentFile && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{attachmentFile.name}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachmentFile(null)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submission Type */}
            <div className="space-y-3">
              <Label>How should students submit?</Label>
              <div className="grid grid-cols-3 gap-3">
                <Card 
                  className={`cursor-pointer transition-all ${submissionType === "text" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                  onClick={() => setSubmissionType("text")}
                >
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">Text Answer</p>
                    <p className="text-xs text-muted-foreground">Students write text</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all ${submissionType === "multiple_choice" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                  onClick={() => setSubmissionType("multiple_choice")}
                >
                  <CardContent className="p-4 text-center">
                    <ListChecks className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">Multiple Choice</p>
                    <p className="text-xs text-muted-foreground">Students select answers</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all ${submissionType === "file" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                  onClick={() => setSubmissionType("file")}
                >
                  <CardContent className="p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">File Upload</p>
                    <p className="text-xs text-muted-foreground">Max 2MB per file</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Multiple Choice Questions */}
            {submissionType === "multiple_choice" && (
              <div className="space-y-4">
                <Tabs value={mcInputMode} onValueChange={(v) => setMcInputMode(v as "manual" | "json")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="json">Import JSON</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="manual" className="space-y-3 mt-4">
                    <div className="max-h-96 overflow-y-auto pr-3 space-y-3">
                      {questions.map((question, qIndex) => (
                        <Card key={question.id} className="relative flex-shrink-0">
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="secondary" className="text-xs">Q{qIndex + 1}</Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(question.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            
                            <Input
                              value={question.title}
                              onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                              placeholder="Enter question..."
                              className="text-sm"
                            />
                            
                            <div className="space-y-2">
                              {question.options.map((opt, optIndex) => (
                                <div key={opt.label} className="flex gap-2 items-center">
                                  <span className="w-6 text-center font-medium text-xs flex-shrink-0">{opt.label}</span>
                                  <Input
                                    value={opt.text}
                                    onChange={(e) => updateQuestionOption(question.id, optIndex, e.target.value)}
                                    placeholder={`Option ${opt.label}`}
                                    className="flex-1 text-sm h-8"
                                  />
                                </div>
                              ))}
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Correct Answer</Label>
                              <RadioGroup 
                                value={question.correctAnswer} 
                                onValueChange={(v) => updateQuestion(question.id, { correctAnswer: v })}
                                className="flex gap-3"
                              >
                                {question.options.map(opt => (
                                  <div key={opt.label} className="flex items-center gap-1">
                                    <RadioGroupItem value={opt.label} id={`${question.id}-${opt.label}`} />
                                    <Label htmlFor={`${question.id}-${opt.label}`} className="text-xs font-normal">{opt.label}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="json" className="space-y-4 mt-4">
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-primary mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">JSON Format Example:</p>
                          <pre className="mt-2 text-xs bg-background p-3 rounded overflow-x-auto">
                            {JSON_EXAMPLE}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          ref={jsonFileInputRef}
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleJsonFileUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => jsonFileInputRef.current?.click()}
                        >
                          <FileJson className="h-4 w-4 mr-2" />
                          Upload JSON File
                        </Button>
                      </div>
                      
                      <Textarea
                        value={jsonInput}
                        onChange={(e) => {
                          setJsonInput(e.target.value);
                          setJsonError("");
                        }}
                        placeholder="Or paste your JSON here..."
                        rows={8}
                        className="font-mono text-sm"
                      />
                      
                      {jsonError && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {jsonError}
                        </div>
                      )}
                      
                      <Button 
                        type="button" 
                        onClick={handleJsonImport}
                        disabled={!jsonInput.trim()}
                        className="w-full"
                      >
                        Import Questions
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {questions.length > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {questions.length} question{questions.length > 1 ? "s" : ""} added
                  </Badge>
                )}
              </div>
            )}

            {/* Due Date & Max Score */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date (optional)</Label>
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Score</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxScore}
                  onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 pt-4 border-t">
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !title.trim()} 
            className="w-full" 
            variant="hero"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Create Assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}