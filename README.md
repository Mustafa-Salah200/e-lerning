# Brighten Learn

A modern Learning Management System (LMS) built for educational institutions to manage courses, assignments, and student-teacher interactions.

## 📚 About This Project

Brighten Learn is a comprehensive educational platform that connects teachers and students. Teachers can create courses, post assignments (including multiple-choice quizzes), and track student progress. Students can browse courses, submit assignments, and view their grades.

## ✨ Features

- **User Authentication**: Separate login flows for students and teachers
- **Course Management**: Teachers can create and manage courses
- **Assignment System**: 
  - Multiple assignment types (text, file upload, multiple-choice)
  - JSON import for bulk question creation
  - Automatic grading for multiple-choice assignments
- **Student Dashboard**: View enrolled courses and upcoming assignments
- **Teacher Dashboard**: Track students, review submissions, and manage content
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technologies Used

This project is built with:

- **React** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling
- **shadcn-ui** - UI component library
- **Supabase** - Backend and authentication
- **React Router** - Navigation

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or bun package manager

### Installation

1. Clone the repository:
```sh
git clone <your-repo-url>
cd brighten-learn-main
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```sh
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 📦 Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── pages/             # Page components
├── lib/               # Utility functions
└── integrations/      # Third-party integrations
```

## 🎓 Usage

### For Teachers:
1. Sign up/login as a teacher
2. Create courses from your dashboard
3. Add assignments with various submission types
4. Review and grade student submissions

### For Students:
1. Sign up/login as a student
2. Browse and enroll in available courses
3. Submit assignments
4. Track your grades and progress

## 🤝 Contributing

This is a student project created for learning purposes. Feel free to fork and experiment!

## 📝 License

This project is open source and available for educational purposes.
# e-lerning
