import { useState } from "react";
import { useCourses } from "@/hooks/useCourses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface CreateCourseDialogProps {
  onCourseCreated?: () => void;
}

const categories = [
  "Development",
  "Design",
  "Data Science",
  "Business",
  "Marketing",
  "Photography",
  "Music",
  "Other",
];

export function CreateCourseDialog({ onCourseCreated }: CreateCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("");
  const { createCourse, loading } = useCourses();

  const handleCreate = async () => {
    if (!title.trim()) return;

    const result = await createCourse(title, description, details, category);
    if (result) {
      setOpen(false);
      resetForm();
      onCourseCreated?.();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDetails("");
    setCategory("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="h-4 w-4 mr-2" />
          Create New Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Web Development"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your course..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Course Details</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Detailed information about what students will learn..."
              rows={4}
            />
          </div>

          <Button onClick={handleCreate} disabled={loading || !title.trim()} className="w-full" variant="hero">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Create Course
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
