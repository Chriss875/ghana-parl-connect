export type FetchEventSourceOptions = {
  method?: string;
  headers?: Record<string,string>;
  body?: string | null;
  signal?: AbortSignal;
  onmessage?: (ev: { data: string; event?: string }) => void;
  onerror?: (err: any) => void;
};

// Minimal fetch-event-source-like helper. It posts (if body provided) and parses text/event-stream frames.
export async function fetchEventSource(url: string, opts: FetchEventSourceOptions): Promise<void> {
  const { method = 'GET', headers = {}, body = null, signal, onmessage, onerror } = opts;

  try {
    const res = await fetch(url, { method, headers, body: body ?? undefined, signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // events are separated by a blank line (\n\n or \r\n\r\n)
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || '';

      for (const raw of parts) {
        if (!raw.trim()) continue;
        const lines = raw.split(/\r?\n/);
        let eventType = 'message';
        let data = '';
        for (let line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            data += line.slice(5).trimRight() + '\n';
          }
        }
        if (data.endsWith('\n')) data = data.slice(0, -1);
        try {
          onmessage?.({ data, event: eventType });
        } catch (e) {
          // swallow handler errors
          console.error('fetchEventSource: onmessage handler error', e);
        }
      }
    }

    // flush leftover if any
    if (buffer.trim()) {
      const lines = buffer.split(/\r?\n/);
      let eventType = 'message';
      let data = '';
      for (let line of lines) {
        if (line.startsWith('event:')) eventType = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trimRight() + '\n';
      }
      if (data.endsWith('\n')) data = data.slice(0, -1);
      if (data) onmessage?.({ data, event: eventType });
    }
  } catch (err) {
    try { onerror?.(err); } catch (e) { /* ignore */ }
    throw err;
  }
}
