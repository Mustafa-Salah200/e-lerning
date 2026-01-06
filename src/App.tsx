import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import BrowseCourses from "./pages/BrowseCourses";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherProfile from "./pages/TeacherProfile";
import CourseDetail from "./pages/CourseDetail";
import AssignmentSubmissions from "./pages/AssignmentSubmissions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/profile" element={
              <ProtectedRoute requiredRole="student">
                <StudentProfile />
              </ProtectedRoute>
            } />
            <Route path="/student/courses" element={
              <ProtectedRoute requiredRole="student">
                <BrowseCourses />
              </ProtectedRoute>
            } />
            <Route path="/student/courses/:courseId" element={
              <ProtectedRoute requiredRole="student">
                <CourseDetail />
              </ProtectedRoute>
            } />
            
            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/profile" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherProfile />
              </ProtectedRoute>
            } />
            <Route path="/teacher/courses/:courseId" element={
              <ProtectedRoute requiredRole="teacher">
                <CourseDetail />
              </ProtectedRoute>
            } />
            <Route path="/teacher/courses/:courseId/assignments/:assignmentId" element={
              <ProtectedRoute requiredRole="teacher">
                <AssignmentSubmissions />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
