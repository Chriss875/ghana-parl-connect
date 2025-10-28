import { fetchEventSource } from './fetchEventSource';

export type DebateSummary = {
  id: number;
  title: string;
  description: string;
  date: string;
  speaker: string;
  committee?: string;
  tags?: string[];
  category?: string;
};

export type DebateDetail = DebateSummary & {
  fullText: string;
  attachments?: Array<{ name: string; url: string }>;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText || "API request failed");
  }
  return res.json();
}


export type SearchDebatesRequest = {
  date?: string; 
  topic?: string; 
  speaker?: string; 
};

export type SearchDebatesResponse = {
  title: string;
  summary: string;
  date?: string;
  speaker?: string;
  tags?: string[];
};


export async function searchDebates(body: SearchDebatesRequest) {
  const url = `${API_BASE}/api/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleRes(res) as Promise<SearchDebatesResponse>;
}

export type DashboardRequest = {
  date: string;
};

export type KeyMetric = {
  label: string;
  value: string;
  change?: string | null;
  change_type?: "increase" | "decrease" | "neutral" | null;
  subtitle?: string | null;
  priority?: number;
};

export type DashboardResponse = {
  date: string; // 2025-07-01
  session_title: string;
  summary: string;
  key_metrics: KeyMetric[];
  spending_by_ministry: Array<{ ministry: string; amount: string }>; // may be empty
  national_project_trends: Array<{ year: string; expenditure: number }>;
  budget_allocations: Array<{ name: string; value: number }>;
  recent_budget_approvals: Array<{ project: string; ministry: string; amount: string; date: string; status: string }>;
  recent_motion_votes: any[];
  bills_passed: string[];
  papers_laid: string[];
};

export async function getDashboardForDate(body: DashboardRequest) {
  // Primary endpoint we expect
  const dashboardUrl = `${API_BASE}/api/dashboard`;
  try {
    const res = await fetch(dashboardUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      // Quick shape check: ensure it has at least a session_title or key_metrics
      if (data && (data.session_title || data.key_metrics || data.summary)) {
        console.debug("getDashboardForDate: /api/dashboard response:", data);
        return data as DashboardResponse;
      }
      // If response doesn't look like a dashboard, fall through to try the other endpoint
      console.warn("getDashboardForDate: /api/dashboard returned unexpected shape, falling back to /api/query", data);
    } else {
      // If not found, try fallback. If other error, read body for message.
      if (res.status !== 404) {
        const text = await res.text().catch(() => "");
        console.warn("getDashboardForDate: /api/dashboard returned non-OK status", res.status, text);
      }
    }
  } catch (err) {
    console.warn("getDashboardForDate: error calling /api/dashboard, will try /api/query", err);
  }

  // Fallback: some backends expose this data on /api/query (older contract). Try that and map to DashboardResponse.
  try {
    const queryUrl = `${API_BASE}/api/query`;
    const res2 = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: body.date }),
    });
    if (!res2.ok) {
      const text = await res2.text().catch(() => "");
      throw new Error(text || res2.statusText || `Query endpoint returned ${res2.status}`);
    }
    const q = await res2.json();
    // Map probable fields into DashboardResponse shape where possible.
    const mapped: DashboardResponse = {
      date: q.date || body.date,
      session_title: q.session_title || q.title || `Session ${body.date}`,
      summary: q.summary || q.description || "",
      key_metrics: q.key_metrics || [],
      spending_by_ministry: q.spending_by_ministry || [],
      national_project_trends: q.national_project_trends || [],
      budget_allocations: q.budget_allocations || [],
      recent_budget_approvals: q.recent_budget_approvals || [],
      recent_motion_votes: q.recent_motion_votes || [],
      bills_passed: q.bills_passed || [],
      papers_laid: q.papers_laid || []
    };
    return mapped;
  } catch (err) {
    throw new Error(`Failed to fetch dashboard data: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// src/lib/readFullDebateStream.ts
export type ReadFullDebateOptions = {
  date: string;
  topic: string;
  speaker?: string;
  onUpdate?: (partialText: string) => void; // called as text streams in
  onFinal?: (data: any) => void;             // called when full JSON arrives
  onError?: (msg: string) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
};

function sanitizeChunk(input: string): string {
  if (!input) return "";
  let s = input.trim();

  // remove leading SSE prefixes if present (defensive)
  s = s.replace(/^data:\s*/gm, "");
  s = s.replace(/^event:\s*/gm, "");

  // If the chunk contains a fenced ```json block, try to extract and parse its inner JSON
  const fencedMatch = s.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    const inner = fencedMatch[1];
    try {
      const parsed = JSON.parse(inner);
      const candidate = extractCandidateFromParsed(parsed);
      if (candidate) return normalizeChunk(candidate);
    } catch (e) {
      // if parsing fails, fall back to using the inner text as-is
      s = inner;
    }
  }

  // If the entire chunk is a JSON object/string, parse it and extract candidate fields
  try {
    const maybeJson = JSON.parse(s);
    const candidate = extractCandidateFromParsed(maybeJson);
    if (candidate) return normalizeChunk(candidate);
  } catch (e) {
    // not JSON — continue
  }

  // unwrap common wrappers like content='...'
  s = s.replace(/content=(?:'|")([\s\S]*?)(?:'|")/g, "$1");

  // remove LLM runtime metadata lines that sometimes appear inline
  s = s.replace(/additional_kwargs=.*$/gm, "");
  s = s.replace(/response_metadata=.*$/gm, "");
  s = s.replace(/usage_metadata=.*$/gm, "");

  // strip stray code fences
  s = s.replace(/```/g, "");

  // Remove common 'json' sentinel or leading JSON key fragments that sometimes arrive as partial output
  // e.g. lines like: json\n"full_context": "..."
  s = s.replace(/^\s*json\b[:\s-]*/i, "");
  // Remove a leading JSON key if the chunk begins with it (e.g. '"full_context": "..."' or 'full_context": ...')
  s = s.replace(/^\s*"?[a-zA-Z_][a-zA-Z0-9_]*"?\s*:\s*/i, "");

  return normalizeChunk(s);
}

function extractCandidateFromParsed(obj: any): string | null {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    // common fields returned by LLM runtimes
    if (typeof obj.content === 'string') return obj.content;
    if (typeof obj.full_context === 'string') return obj.full_context;
    if (typeof obj.summary === 'string') return obj.summary;
    if (typeof obj.text === 'string') return obj.text;
    // sometimes the payload is nested
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'string') return obj[k];
    }
    // as a last resort, stringify
    try { return JSON.stringify(obj); } catch { return null; }
  }
  return null;
}

function normalizeChunk(raw: string): string {
  if (!raw) return "";
  let t = raw;
  // unescape common escape sequences (\n, \t) that sometimes appear double-escaped
  t = t.replace(/\\n/g, "\n");
  t = t.replace(/\\r/g, "\n");
  t = t.replace(/\\t/g, "\t");
  // collapse multiple blank lines to at most two
  t = t.replace(/\n{3,}/g, "\n\n");
  // trim trailing/leading whitespace
  return t.trim();
}

function extractJSON(text: string): any | null {
  if (!text) return null;
  try {
    const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced) return JSON.parse(fenced[1]);
  } catch {}
  try {
    const open = text.lastIndexOf("{");
    const close = text.lastIndexOf("}");
    if (open !== -1 && close > open) {
      return JSON.parse(text.slice(open, close + 1));
    }
  } catch {}
  return null;
}

export async function readFullDebateStream(opts: ReadFullDebateOptions): Promise<void> {
  const { date, topic, speaker, onUpdate, onFinal, onError, onComplete, signal } = opts;
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";
  const url = `${API_BASE}/api/full_debate_stream`;

  // Use fetchEventSource which implements the SSE client behavior similar to the article
  try {
    let accumulated = "";
    let metaBuffer = "";

    await fetchEventSource(url, {
      method: 'POST',
      body: JSON.stringify({ date, topic, speaker }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      signal,
      onmessage(ev) {
        const data = ev.data;
        if (!data) return;

        // SSE stream may send a terminal marker
        if (data === '[DONE]') {
          const parsed = extractJSON(accumulated + '\n' + metaBuffer);
          if (parsed) {
            onFinal?.(parsed);
          } else {
            onFinal?.({ title: 'Full Debate', full_context: accumulated, date, speaker });
          }
          onComplete?.();
          return;
        }

        // If it looks like JSON meta, buffer it until we can parse a full object
        const looksLikeJsonFragment = /(^|\s)json\b/i.test(data) || /"[a-zA-Z0-9_]+"\s*:\s*/.test(data) || /\{\s*"/.test(data);
        if (looksLikeJsonFragment) {
          metaBuffer += '\n' + data;
          const tryParse = extractJSON(accumulated + '\n' + metaBuffer);
          if (tryParse) {
            onFinal?.(tryParse);
            onComplete?.();
          }
          return;
        }

        // sanitize and append normal text fragments
        const clean = sanitizeChunk(data);
        if (clean) {
          accumulated += (accumulated ? '\n' : '') + clean;
          onUpdate?.(accumulated);
        }
      },
      onerror(err) {
        // fetchEventSource will call onerror on network errors; bubble up
        onError?.(err?.message || String(err));
      }
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.log('Stream aborted');
    } else {
      onError?.(err?.message || 'Failed to stream debate');
    }
    onComplete?.();
  }
}


