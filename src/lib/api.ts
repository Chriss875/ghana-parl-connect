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


export async function getFullDebate(
  id: number | string,
  dateParam?: string,
  topic?: string,
  speaker?: string
) {
  const url = `${API_BASE}/api/full_debate`;
  const body: Record<string, any> = {};
  if (dateParam) body.date = dateParam;
  if (topic) body.topic = topic;
  if (speaker) body.speaker = speaker;
  if (id !== undefined && id !== null) body.id = id;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await handleRes(res)) as any;
  // Normalize backend keys to our frontend DebateDetail shape
  const detail: DebateDetail = {
    id: data.id ?? (typeof id === "number" ? id : 0),
    title: data.title,
    description: data.summary || data.description || "",
    date: data.date,
    speaker: data.speaker,
    tags: Array.isArray(data.tags) ? data.tags : typeof data.tags === "string" ? data.tags.split(",").map((t: string) => t.trim()) : data.tags,
    category: data.category || (Array.isArray(data.tags) ? data.tags[0] : undefined),
    fullText: data.full_context || data.fullText || data.full_text || "",
    attachments: data.attachments,
  };
  return detail;
}
