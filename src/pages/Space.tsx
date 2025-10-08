import { useState } from "react";
import { Search, Hash, MessageCircle, Bot, ThumbsUp, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Space = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const committees = [
    { id: 1, name: "Constitutional & Legal Affairs", members: 1240 },
    { id: 2, name: "Finance", members: 2156 },
    { id: 3, name: "Education", members: 1890 },
    { id: 4, name: "Health", members: 1654 },
    { id: 5, name: "Agriculture", members: 982 }
  ];

  const featuredQuestions = [
    {
      id: 1,
      committee: "Finance Committee",
      question: "What are the key priorities of the Finance Committee for the upcoming fiscal year?",
      author: "Kofi Mensah",
      replies: 24,
      likes: 45,
      hasBot: true
    },
    {
      id: 2,
      committee: "Education Committee",
      question: "How is the Education Committee addressing the issue of teacher shortages in rural areas?",
      author: "Ama Darko",
      replies: 18,
      likes: 32,
      hasBot: true
    },
    {
      id: 3,
      committee: "Health Committee",
      question: "What measures are being taken by the Health Committee to improve access to healthcare in rural communities?",
      author: "Yaw Boateng",
      replies: 31,
      likes: 56,
      hasBot: true
    }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Space</h1>
        <p className="text-lg text-muted-foreground">
          Join committees and engage with fellow Ghanaian citizens
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for committees or topics"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Committees */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Committees</h2>
        <div className="flex flex-wrap gap-3">
          {committees.map((committee) => (
            <Button
              key={committee.id}
              variant="outline"
              className="h-auto py-3 px-4 justify-start"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold">{committee.name}</span>
                <span className="text-xs text-muted-foreground">
                  {committee.members.toLocaleString()} members
                </span>
              </div>
            </Button>
          ))}
        </div>
      </section>

      {/* Featured Questions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Featured Questions</h2>
        <div className="grid gap-4">
          {featuredQuestions.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Hash className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Badge variant="secondary">{item.committee}</Badge>
                    <CardTitle className="text-lg leading-relaxed">
                      {item.question}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {item.author.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{item.author}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{item.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MessageSquare className="h-4 w-4" />
                      <span>{item.replies} replies</span>
                    </button>
                  </div>
                  {item.hasBot && (
                    <Button variant="outline" size="sm" className="gap-2">
                      <Bot className="h-4 w-4" />
                      Ask Bot
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Ask Question Button */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Have a question?</h3>
                <p className="text-sm text-muted-foreground">
                  Ask the community or get instant answers from our AI bot
                </p>
              </div>
            </div>
            <Button size="lg">
              Ask Question
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Space;
