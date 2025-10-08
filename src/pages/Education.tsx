import { useState } from "react";
import { Book, Video, FileText, Award, Play, Download, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Education = () => {
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  const imageCards = [
    {
      id: 1,
      title: "Introduction to Parliament",
      description: "Learn about Ghana's legislative system",
      image: "parliament-building"
    },
    {
      id: 2,
      title: "The Role of the Constitution",
      description: "Understanding Ghana's constitutional framework",
      image: "flag"
    }
  ];

  const lessons = [
    {
      id: 1,
      title: "Reading the Hansard",
      type: "document",
      duration: "15 min",
      icon: Book
    },
    {
      id: 2,
      title: "Understanding Parliamentary Procedures",
      type: "video",
      duration: "20 min",
      icon: Video
    },
    {
      id: 3,
      title: "The Legislative Process",
      type: "document",
      duration: "12 min",
      icon: FileText
    }
  ];

  const quizzes = [
    {
      id: 1,
      title: "Parliamentary Basics",
      questions: 10,
      badge: "Beginner Badge"
    },
    {
      id: 2,
      title: "Legislative Process",
      questions: 15,
      badge: "Intermediate Badge"
    },
    {
      id: 3,
      title: "Constitutional Expert",
      questions: 20,
      badge: "Expert Badge"
    }
  ];

  const toggleLesson = (id: number) => {
    if (completedLessons.includes(id)) {
      setCompletedLessons(completedLessons.filter(l => l !== id));
    } else {
      setCompletedLessons([...completedLessons, id]);
    }
  };

  const progress = (completedLessons.length / lessons.length) * 100;

  return (
    <div className="space-y-8 pb-20 md:pb-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Civic Education</h1>
        <p className="text-lg text-muted-foreground">
          Learn About Ghana's Legislative System
        </p>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Your Progress</span>
                <span className="text-muted-foreground">{completedLessons.length} of {lessons.length} completed</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Featured Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {imageCards.map((card) => (
            <Card key={card.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-6xl mb-4">
                      {card.image === "parliament-building" ? "🏛️" : "🇬🇭"}
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{card.title}</h3>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <p className="text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Short Lessons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Short Lessons</h2>
        <div className="grid gap-4">
          {lessons.map((lesson) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const Icon = lesson.icon;
            
            return (
              <Card key={lesson.id} className={isCompleted ? "border-primary/50 bg-primary/5" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${isCompleted ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {lesson.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && <CheckCircle className="h-5 w-5 text-primary" />}
                      <Button onClick={() => toggleLesson(lesson.id)}>
                        {lesson.type === "video" ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Watch
                          </>
                        ) : (
                          <>
                            <Book className="h-4 w-4 mr-2" />
                            Read
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quiz Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Quiz: Test Your Knowledge</h2>
        </div>
        <p className="text-muted-foreground">
          Complete quizzes to earn badges and demonstrate your understanding of Ghana's parliament
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-secondary" />
                  {quiz.title}
                </CardTitle>
                <CardDescription>{quiz.questions} Questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/10 rounded-lg text-center">
                  <p className="text-sm font-medium text-foreground">Earn:</p>
                  <p className="text-lg font-bold text-secondary">{quiz.badge}</p>
                </div>
                <Button className="w-full">Start Quiz</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Education;
