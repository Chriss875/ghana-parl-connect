import { useState } from "react";
import { Search, Filter, Calendar, User, Tag, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const Hansard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("last30days");
  const [speakerFilter, setSpeakerFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");

  // Sample data - to be replaced with API calls
  const debates = [
    {
      id: 1,
      title: "National Budget Allocation for Education Sector 2024",
      description: "Detailed discussion on increasing budget allocation for schools and universities across Ghana...",
      date: "15 January 2024",
      speaker: "Hon. Jane Mensah",
      committee: "Education Committee",
      tags: ["Budget", "Education", "Public Policy"],
      category: "Education"
    },
    {
      id: 2,
      title: "Climate Change Adaptation Strategies",
      description: "Parliamentary debate on implementing comprehensive climate adaptation measures for coastal regions...",
      date: "12 January 2024",
      speaker: "Hon. Kwame Asante",
      committee: "Environment Committee",
      tags: ["Climate", "Environment", "Coastal Protection"],
      category: "Environment"
    },
    {
      id: 3,
      title: "Digital Ghana Agenda Implementation",
      description: "Review of progress in digital infrastructure development and e-governance initiatives...",
      date: "10 January 2024",
      speaker: "Hon. Akosua Frema",
      committee: "Communications Committee",
      tags: ["Technology", "Digital Ghana", "E-Governance"],
      category: "Technology"
    }
  ];

  const categoryColors: Record<string, string> = {
    Education: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Environment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Technology: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Latest Parliamentary Debates
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Stay updated with the most recent Hansard records and parliamentary discussions
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Debates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by topic, speaker, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last30days">Last 30 days</SelectItem>
                  <SelectItem value="last90days">Last 90 days</SelectItem>
                  <SelectItem value="thisyear">This Year</SelectItem>
                  <SelectItem value="lastyear">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Speaker
              </label>
              <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Speakers</SelectItem>
                  <SelectItem value="jane-mensah">Hon. Jane Mensah</SelectItem>
                  <SelectItem value="kwame-asante">Hon. Kwame Asante</SelectItem>
                  <SelectItem value="akosua-frema">Hon. Akosua Frema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Topic
              </label>
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full gap-2">
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debate Cards */}
      <div className="grid gap-6">
        {debates.map((debate) => (
          <Card key={debate.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Badge className={categoryColors[debate.category]}>
                    {debate.category}
                  </Badge>
                  <CardTitle className="text-xl">{debate.title}</CardTitle>
                  <CardDescription>{debate.description}</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {debate.date}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {debate.speaker}
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {debate.committee}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {debate.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Button className="w-full md:w-auto">
                Read Full Debate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Hansard;
