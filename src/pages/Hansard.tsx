import { useState, useRef, useEffect } from "react";
import { Search, Filter, Calendar, User, Tag, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SPEAKERS from "@/data/speakers";
import DATES from "@/data/dates";
import { MarkdownRenderer } from "@/components/MarkDownRenderer";
import { Badge } from "@/components/ui/badge";
import { FullDebateDialog } from '@/components/FullDebateDialog';

const Hansard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("1st July 2025");
  const [speakerFilter, setSpeakerFilter] = useState("Hon. Mahama Ayariga");
  const [topicFilter, setTopicFilter] = useState("all");

  const SAMPLE_DEBATES = [
    {
      id: 1,
      title: "Proceedings on the 2025 Budget, Mid-Year Review, and Associated Legislation",
      description: "Parliamentary session focused on the Mid-Year Fiscal Policy Review of the 2025 Budget, with key revenue and spending updates.",
      date: "2025-07-01",
      speaker: "Hon. Ken Ofori-Atta",
      tags: ["Budget", "Finance"],
      category: "Finance",
      committee: "Finance Committee"
    },
    {
      id: 2,
      title: "Debate on Education Sector Funding Allocations",
      description: "Members discussed allocations for GETFund and education initiatives in 2025.",
      date: "2025-03-29",
      speaker: "Hon. Mahama Ayariga",
      tags: ["Education", "GETFund"],
      category: "Education",
      committee: "Education Committee"
    }
  ];

  const [debates, setDebates] = useState<any[]>(SAMPLE_DEBATES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);
  const [lastAppliedFilters, setLastAppliedFilters] = useState<{
    date?: string;
    topic?: string;
    speaker?: string;
  } | null>(null);

  // New state for FullDebateDialog
  const [debateDialogOpen, setDebateDialogOpen] = useState(false);
  const [selectedDebate, setSelectedDebate] = useState<{date: string, topic: string, speaker: string} | null>(null);

  const categoryColors: Record<string, string> = {
    Education: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Environment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Technology: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  };

  const [debateHistory, setDebateHistory] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('debate_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  function addToHistory(newDebates: any[]) {
    if (!Array.isArray(newDebates) || newDebates.length === 0) return;
    setDebateHistory((prev) => {
      const map = new Map<string, any>();
      for (const d of newDebates) {
        const key = d.id != null ? `id:${d.id}` : `t:${String(d.title)}:${String(d.date)}`;
        if (!map.has(key) && d) map.set(key, d);
      }
      for (const p of prev) {
        const key = p.id != null ? `id:${p.id}` : `t:${String(p.title)}:${String(p.date)}`;
        if (!map.has(key) && p) map.set(key, p);
      }
      const merged = Array.from(map.values()).slice(0, 10);
      try {
        localStorage.setItem('debate_history', JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }

  // lazy import the api to avoid unused import before the file exists in the repo
  async function applyFilters() {
    setError(null);
    setLoading(true);
    setSearchLoading(true);
    try {
      const { searchDebates } = await import("@/lib/api");
      const dateToSend = formatOrdinalDate(dateFilter || searchQuery || "");
      const body = {
        date: dateToSend,
        topic: topicFilter === "all" ? undefined : topicFilter,
        speaker: speakerFilter === "all" ? undefined : speakerFilter,
      };
      setLastAppliedFilters({ date: body.date, topic: body.topic, speaker: body.speaker });
      const res = await searchDebates(body as any);

      const fencedJsonMatch = res.summary?.match(/```json\s*([\s\S]*?)\s*```/i);
      if (fencedJsonMatch && fencedJsonMatch[1]) {
        try {
          const parsed = JSON.parse(fencedJsonMatch[1]);
          const newDebates = [
            {
              id: parsed.id || 0,
              title: parsed.title || res.title,
              description: parsed.summary || res.summary,
              date: parsed.date || res.date,
              speaker: parsed.speaker || res.speaker,
              tags: parsed.tags ? parsed.tags.split ? parsed.tags.split(",") : parsed.tags : res.tags,
              category: parsed.category || parsed.tags?.[0] || res.tags?.[0]
            }
          ];
          setDebates(newDebates);
          addToHistory(newDebates);
          return;
        } catch (e) {}
      }

      const newDebates = [
        {
          id: 0,
          title: res.title,
          description: res.summary,
          date: res.date,
          speaker: res.speaker,
          tags: res.tags || [],
          category: res.tags?.[0] || "",
        }
      ];
      setDebates(newDebates);
      addToHistory(newDebates);
    } catch (err: any) {
      setError(err?.message || "Failed to load debates");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }

  // New simplified function for opening the FullDebateDialog
  function openFullDebate(debate: any) {
    const dateFromTarget = debate.date || dateFilter;
    const topicFromTarget = debate.category || (Array.isArray(debate.tags) ? debate.tags[0] : undefined);
    const topicFromFilters = topicFilter && topicFilter !== "all" ? topicFilter : undefined;
    const topic = topicFromTarget || topicFromFilters || lastAppliedFilters?.topic || "General";
    
    const speaker = debate.speaker || speakerFilter || lastAppliedFilters?.speaker || "";

    setSelectedDebate({
      date: formatOrdinalDate(dateFromTarget),
      topic,
      speaker,
    });
    setDebateDialogOpen(true);
  }

  function formatOrdinalDate(dateInput: string) {
    const dt = new Date(dateInput);
    if (isNaN(dt.getTime())) return dateInput;
    const day = dt.getDate();
    const month = dt.toLocaleString("en-US", { month: "long" });
    const year = dt.getFullYear();
    const ordinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"], v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    return `${ordinal(day)} ${month} ${year}`;
  }

  // Autocomplete state for dates and speakers
  const [showDatesList, setShowDatesList] = useState(false);
  const [showSpeakersList, setShowSpeakersList] = useState(false);
  const [filteredDates, setFilteredDates] = useState<string[]>(DATES);
  const [filteredSpeakers, setFilteredSpeakers] = useState<string[]>(SPEAKERS);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const speakerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!dateFilter) setFilteredDates(DATES);
    else setFilteredDates(DATES.filter((d) => d.toLowerCase().includes(dateFilter.toLowerCase())));
  }, [dateFilter]);

  useEffect(() => {
    if (!speakerFilter || speakerFilter === "all") setFilteredSpeakers(SPEAKERS);
    else setFilteredSpeakers(SPEAKERS.filter((s) => s.toLowerCase().includes(speakerFilter.toLowerCase())));
  }, [speakerFilter]);

  function handleDateBlur() { setTimeout(() => setShowDatesList(false), 150); }
  function handleSpeakerBlur() { setTimeout(() => setShowSpeakersList(false), 150); }

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
            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </label>
              <div className="relative">
                <Input
                  ref={dateInputRef}
                  placeholder="1st July 2025"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  onFocus={() => setShowDatesList(true)}
                  onBlur={handleDateBlur}
                />
                {showDatesList && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover p-1">
                    {filteredDates.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No dates</div>
                    ) : (
                      filteredDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setDateFilter(d); setShowDatesList(false); }}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-accent/20"
                        >
                          {d}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Speaker Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Speaker
              </label>
              <div className="relative">
                <Input
                  ref={speakerInputRef}
                  placeholder="Hon. Mahama Ayariga"
                  value={speakerFilter}
                  onChange={(e) => setSpeakerFilter(e.target.value)}
                  onFocus={() => setShowSpeakersList(true)}
                  onBlur={handleSpeakerBlur}
                />
                {showSpeakersList && (
                  <div className="absolute z-50 mt-1 w-full max-h-72 overflow-auto rounded-md border bg-popover p-1">
                    {filteredSpeakers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No speakers</div>
                    ) : (
                      filteredSpeakers.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setSpeakerFilter(s); setShowSpeakersList(false); }}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-accent/20"
                        >
                          {s}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Topic Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Topic
              </label>
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="bottom" position="popper" align="start">
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Environment">Environment</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply Filters Button */}
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full gap-2">
                {searchLoading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                {searchLoading ? "Loading..." : "Apply Filters"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Searches / History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Recent Searches</CardTitle>
          <CardDescription>Last {debateHistory?.length || 0} debates you opened</CardDescription>
        </CardHeader>
        <CardContent>
          {debateHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent debates</div>
          ) : (
            <div className="grid gap-2">
              {debateHistory.map((d: any) => (
                <div key={(d.id ?? d.title) + String(d.date)} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{d.date} — {d.speaker || ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openFullDebate(d)}>Open</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debate Cards */}
      <div className="grid gap-6">
        {debates.map((debate) => (
          <Card key={debate.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Badge className={categoryColors[debate.category || ""] || ""}>
                    {debate.category || ""}
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
                {(() => {
                  const tags: string[] = Array.isArray(debate.tags)
                    ? debate.tags
                    : typeof debate.tags === "string"
                    ? debate.tags.split(",").map((t: string) => t.trim())
                    : [];
                  return tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ));
                })()}
              </div>

              <Button onClick={() => openFullDebate(debate)} className="w-full md:w-auto">
                Read Full Debate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FullDebateDialog */}
      {selectedDebate && (
        <FullDebateDialog
          open={debateDialogOpen}
          onClose={() => setDebateDialogOpen(false)}
          date={selectedDebate.date}
          topic={selectedDebate.topic}
          speaker={selectedDebate.speaker}
        />
      )}
    </div>
  );
};

export default Hansard;
