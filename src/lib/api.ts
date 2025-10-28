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


// lib/api.ts

export type ReadFullDebateOptions = {
  date: string;
  topic: string;
  speaker?: string;
  onUpdate?: (partialText: string) => void;
  onFinal?: (data: any) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
};

// Sanitize incoming chunk by removing LLM wrapper metadata
function sanitizeChunk(raw: string): string {
  if (!raw) return "";
  let text = raw;
  
  // Remove SSE data: prefix if present
  text = text.replace(/^data:\s*/gm, "");
  // Aggressively remove common LLM runtime metadata that may surround the content
  // Remove map-like metadata blocks: additional_kwargs={...}, response_metadata={...}, usage_metadata={...}
  text = text.replace(/additional_kwargs=\{[\s\S]*?\}+/g, "");
  text = text.replace(/response_metadata=\{[\s\S]*?\}+/g, "");
  text = text.replace(/usage_metadata=\{[\s\S]*?\}+/g, "");
  // Remove id fields like id='run-...' or id="run-..."
  text = text.replace(/id=(?:'|\")[^'\"]*(?:'|\")/g, "");

  // If there are explicit content='...' or content="..." fragments, extract and join them.
  const contentMatches = [...text.matchAll(/content=(?:'|\")([\s\S]*?)(?:'|\")/g)];
  if (contentMatches.length > 0) {
    text = contentMatches.map((m) => m[1] || "").join("");
  } else {
    // Fallback: remove any leftover 'content=' literal and surrounding quotes
    text = text.replace(/content=/g, "");
    text = text.replace(/^["']|["']$/g, "");
  }

  // Strip any remaining metadata-like tokens that may trail without braces
  text = text.replace(/additional_kwargs=[^\s]*/g, "");
  text = text.replace(/response_metadata=[^\s]*/g, "");
  text = text.replace(/usage_metadata=[^\s]*/g, "");

  // Unescape common sequences and remove escaped double/triple sequences
  text = text.replace(/\\n/g, "\n");
  text = text.replace(/\\t/g, "\t");
  text = text.replace(/\\r/g, "\r");
  text = text.replace(/\\"/g, '"');
  text = text.replace(/\\'/g, "'");

  // Collapse multiple whitespace/newlines a bit
  text = text.replace(/\s+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

// Extract final JSON from accumulated text
function extractJSON(text: string): any | null {
  if (!text) return null;
  
  // Try fenced code block first
  const fenceMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch (e) {
      console.error("Failed to parse fenced JSON:", e);
    }
  }
  
  // Try to find JSON object by braces
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch (e) {
      console.error("Failed to parse extracted JSON:", e);
    }
  }
  
  return null;
}


export async function readFullDebateStream(opts: ReadFullDebateOptions): Promise<void> {
  const { date, topic, speaker, onUpdate, onFinal, onError, onComplete, signal } = opts;
  
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";
  const url = `${API_BASE}/api/full_debate_stream`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, topic, speaker }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedText = "";
    // Keep a short history of recently appended fragments to avoid duplicates
    const recentFragments: string[] = [];
    const pushRecent = (s: string) => {
      recentFragments.push(s);
      if (recentFragments.length > 64) recentFragments.shift();
    };
    const seenRecently = (s: string) => recentFragments.includes(s);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // --- Immediate best-effort processing ---
      // Some backends stream many `data: content='...'` fragments without clear SSE event separators.
      // Extract any content='...' occurrences from the incoming bytes and push them to the accumulator
      // immediately so the UI can render line-by-line like ChatGPT.
      try {
        const immediateMatches = [...chunk.matchAll(/content=(?:'|")([\s\S]*?)(?:'|\")/g)];
        for (const m of immediateMatches) {
          const raw = m[1] || "";
          const sanitized = sanitizeChunk(raw);
          if (sanitized) {
            // skip very small or empty fragments
            if (sanitized.length < 2) continue;
            // skip if we've seen this exact fragment recently
            if (seenRecently(sanitized)) continue;
            accumulatedText += (accumulatedText ? "\n" : "") + sanitized;
            pushRecent(sanitized);
            console.debug('[readFullDebateStream] appended immediate sanitized chunk:', sanitized.slice(0, 200));
            onUpdate?.(accumulatedText);
          }
        }
      } catch (e) {
        console.warn('readFullDebateStream immediate processing error', e);
      }

      // Split by double newline (SSE event separator)
      const events = buffer.split("\n\n");
      buffer = events.pop() || ""; // Keep incomplete event in buffer

      for (const eventBlock of events) {
        if (!eventBlock.trim()) continue;

        const lines = eventBlock.split("\n");
        let eventType = "message";
        let eventData = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.replace("event:", "").trim();
          } else if (line.startsWith("data:")) {
            eventData += line.replace("data:", "").trim() + "\n";
          }
        }

        eventData = eventData.trim();
        if (!eventData) continue;

        // Handle different event types
        if (eventData === "[DONE]") {
          // Stream complete - try to parse final JSON
          const parsed = extractJSON(accumulatedText);
          if (parsed) {
            onFinal?.(parsed);
          } else {
            onFinal?.({
              title: "Full Debate",
              full_context: accumulatedText,
              date,
              speaker,
            });
          }
          onComplete?.();
          return;
        }

        // Treat plain message events as doc content as well (some backends don't label 'doc')
        if (eventType === "doc" || eventType === "message") {
          // Sanitize and accumulate
          const sanitized = sanitizeChunk(eventData);
          if (sanitized) {
            if (sanitized.length < 2) continue;
            if (seenRecently(sanitized)) {
              // already appended recently — skip
            } else {
              accumulatedText += (accumulatedText ? "\n" : "") + sanitized;
              pushRecent(sanitized);
              console.debug('[readFullDebateStream] appended event sanitized chunk:', sanitized.slice(0, 200));
              onUpdate?.(accumulatedText);
            }
          }
        } else if (eventType === "final") {
          // Final structured data received
          try {
            const parsed = JSON.parse(eventData);
            onFinal?.(parsed);
            onComplete?.();
            return;
          } catch (e) {
            console.error("Failed to parse final event:", e);
          }
        } else if (eventType === "error") {
          const errorMsg = eventData.replace(/^ERROR:\s*/i, "");
          onError?.(errorMsg);
          onComplete?.();
          return;
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const sanitized = sanitizeChunk(buffer);
      if (sanitized) {
        accumulatedText += sanitized;
        onUpdate?.(accumulatedText);
      }
    }

    onComplete?.();

  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log("Stream aborted by user");
    } else {
      onError?.(err.message || "Failed to stream debate");
    }
    onComplete?.();
  }
}


