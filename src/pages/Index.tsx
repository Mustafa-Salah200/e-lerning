import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Star
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Interactive Lessons",
    description: "Engaging content with videos, quizzes, and hands-on exercises.",
  },
  {
    icon: Users,
    title: "Expert Instructors",
    description: "Learn from industry professionals with real-world experience.",
  },
  {
    icon: Award,
    title: "Earn Certificates",
    description: "Get recognized for your achievements with verified certificates.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Learning",
    description: "Personalized learning paths tailored to your goals and pace.",
  },
];

const stats = [
  { value: "50K+", label: "Students" },
  { value: "500+", label: "Courses" },
  { value: "98%", label: "Satisfaction" },
  { value: "24/7", label: "Support" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">EduLearn</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="#courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Courses
            </Link>
            <Link to="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 gradient-hero">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>New: AI-Powered Learning Paths</span>
          </div>
          
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Learn Without Limits,{" "}
            <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">Grow Without Boundaries</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Transform your skills with expert-led courses, interactive lessons, and a supportive learning community. Start your journey today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/student">
                Start Learning Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="gap-2">
              <Play className="h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-heading text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-muted-foreground">
              Our platform provides all the tools and resources you need to learn effectively and achieve your goals.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                variant="interactive"
                className="text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                    <feature.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card variant="elevated" className="overflow-hidden gradient-secondary text-secondary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-secondary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of students already learning on our platform. Get started for free and unlock your potential.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="accent" size="xl" asChild>
                  <Link to="/student">
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
                  <Link to="/teacher">
                    Become an Instructor
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold">EduLearn</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EduLearn. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
