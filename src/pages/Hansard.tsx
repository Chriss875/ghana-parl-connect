import { useState, useRef, useEffect } from "react";
import { Search, Filter, Calendar, User, Tag, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SPEAKERS from "@/data/speakers";
import DATES from "@/data/dates";
import { Badge } from "@/components/ui/badge";

const Hansard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("1st July 2025");
  const [speakerFilter, setSpeakerFilter] = useState("Hon. Mahama Ayariga");
  const [topicFilter, setTopicFilter] = useState("all");

  // Debates will be populated from backend search results
  const [debates, setDebates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryColors: Record<string, string> = {
    Education: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Environment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Technology: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  };

  // lazy import the api to avoid unused import before the file exists in the repo
  async function applyFilters() {
    setError(null);
    setLoading(true);
    try {
      const { searchDebates } = await import("@/lib/api");
      // Frontend should send: { date: '29th March 2025', topic: 'Education', speaker: 'Hon. Mahama Ayariga' }
      const dateToSend = formatOrdinalDate(dateFilter || searchQuery || "");
      const body = {
        date: dateToSend,
        topic: topicFilter === "all" ? undefined : topicFilter,
        speaker: speakerFilter === "all" ? undefined : speakerFilter,
      };
      const res = await searchDebates(body as any);

      // Backend returns a summary field that contains a fenced code block with JSON.
      // Try to extract the JSON from the fenced block and parse it.
      const fencedJsonMatch = res.summary?.match(/```json\s*([\s\S]*?)\s*```/i);
      if (fencedJsonMatch && fencedJsonMatch[1]) {
        try {
          const parsed = JSON.parse(fencedJsonMatch[1]);
          setDebates([
            {
              id: parsed.id || 0,
              title: parsed.title || res.title,
              description: parsed.summary || res.summary,
              date: parsed.date || res.date,
              speaker: parsed.speaker || res.speaker,
              tags: parsed.tags ? parsed.tags.split ? parsed.tags.split(",") : parsed.tags : res.tags,
              category: parsed.category || parsed.tags?.[0] || res.tags?.[0]
            }
          ]);
          return;
        } catch (e) {
          // fallthrough to using the response directly
        }
      }

      // Fallback: create a single debate entry from the response fields
      setDebates([
        {
          id: 0,
          title: res.title,
          description: res.summary,
          date: res.date,
          speaker: res.speaker,
          tags: res.tags || [],
          category: res.tags?.[0] || "",
        }
      ]);
    } catch (err: any) {
      setError(err?.message || "Failed to load debates");
    } finally {
      setLoading(false);
    }
  }

  async function readFullDebate(id: number) {
    setError(null);
    setLoading(true);
    try {
      const { getFullDebate } = await import("@/lib/api");
      // Format the debate date as '29th March 2025' if available for the API
      const target = debates.find((d) => d.id === id);
      const formattedDate = target && target.date ? formatOrdinalDate(target.date) : undefined;
  const topic = target?.category || (target?.tags && target.tags[0]) || topicFilter === "all" ? undefined : topicFilter;
  const speaker = target?.speaker || (speakerFilter === "all" ? undefined : speakerFilter) || undefined;

  // getFullDebate will POST { id, date, topic, speaker }
  const detail = await getFullDebate(id, formattedDate, topic as any, speaker as any);

      const fullHtml = `<h1>${detail.title}</h1><p><strong>${detail.speaker} — ${detail.date}</strong></p><div>${detail.full_context}</div>`;
      const win = window.open("", "_blank");
      if (win) {
        win.document.title = detail.title;
        win.document.body.innerHTML = fullHtml;
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load full debate");
    } finally {
      setLoading(false);
    }
  }

  function formatOrdinalDate(dateInput: string) {
    // Try to parse a date string. If it's already in a readable format, attempt Date parsing.
    const dt = new Date(dateInput);
    if (isNaN(dt.getTime())) {
      // If parsing fails, return the original string (best-effort)
      return dateInput;
    }
    const day = dt.getDate();
    const month = dt.toLocaleString("en-US", { month: "long" });
    const year = dt.getFullYear();
    const ordinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"], v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    return `${ordinal(day)} ${month} ${year}`;
  }

  // Autocomplete state for dates and speakers (custom dropdown)
  const [showDatesList, setShowDatesList] = useState(false);
  const [showSpeakersList, setShowSpeakersList] = useState(false);
  const [filteredDates, setFilteredDates] = useState<string[]>(DATES);
  const [filteredSpeakers, setFilteredSpeakers] = useState<string[]>(SPEAKERS);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const speakerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // When dateFilter changes, update filteredDates (show full list when empty)
    if (!dateFilter) {
      setFilteredDates(DATES);
    } else {
      const q = dateFilter.toLowerCase();
      setFilteredDates(DATES.filter((d) => d.toLowerCase().includes(q)));
    }
  }, [dateFilter]);

  useEffect(() => {
    if (!speakerFilter || speakerFilter === "all") {
      setFilteredSpeakers(SPEAKERS);
    } else {
      const q = speakerFilter.toLowerCase();
      setFilteredSpeakers(SPEAKERS.filter((s) => s.toLowerCase().includes(q)));
    }
  }, [speakerFilter]);

  // helpers that allow clicks inside the dropdown before blur hides it
  function handleDateBlur() {
    setTimeout(() => setShowDatesList(false), 150);
  }
  function handleSpeakerBlur() {
    setTimeout(() => setShowSpeakersList(false), 150);
  }

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
                Date
              </label>
              {/* Free-text date input with native datalist suggestions (hybrid single box) */}
              <div className="relative">
                <Input
                  ref={dateInputRef}
                  placeholder="1st July 2025"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  onFocus={() => setShowDatesList(true)}
                  onBlur={handleDateBlur}
                  aria-label="Date filter (e.g. 1st July 2025)"
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
                          onClick={() => {
                            setDateFilter(d);
                            setShowDatesList(false);
                          }}
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

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Speaker
              </label>
              {/* Free-text speaker input with native datalist suggestions (hybrid single box) */}
              <div className="relative">
                <Input
                  ref={speakerInputRef}
                  placeholder="Hon. Mahama Ayariga"
                  value={speakerFilter}
                  onChange={(e) => setSpeakerFilter(e.target.value)}
                  onFocus={() => setShowSpeakersList(true)}
                  onBlur={handleSpeakerBlur}
                  aria-label="Speaker filter (e.g. Hon. Mahama Ayariga)"
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
                          onClick={() => {
                            setSpeakerFilter(s);
                            setShowSpeakersList(false);
                          }}
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

            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full gap-2">
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

              <Button onClick={() => readFullDebate(debate.id)} className="w-full md:w-auto">
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
