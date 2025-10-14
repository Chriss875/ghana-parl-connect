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
  const url = `http://localhost:8000/api/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleRes(res) as Promise<SearchDebatesResponse>;
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
  return handleRes(res) as Promise<{
    title: string;
    full_context: string;
    date?: string;
    speaker?: string;
    tags?: string | string[];
  }>;
}
