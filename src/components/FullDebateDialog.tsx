// components/FullDebateDialog.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { MarkdownRenderer } from './MarkDownRenderer';
import { readFullDebateStream } from '@/lib/api';

interface FullDebateDialogProps {
  open: boolean;
  onClose: () => void;
  date: string;
  topic: string;
  speaker: string;
}

export function FullDebateDialog({ open, onClose, date, topic, speaker }: FullDebateDialogProps) {
  const [streaming, setStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [finalData, setFinalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastFragments, setLastFragments] = useState<string[]>([]);
  
  
  const [debouncedContent, setDebouncedContent] = useState("");
  const debouncedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!streaming) {
      // when streaming stops, ensure debouncedContent is final
      setDebouncedContent(streamedContent);
      if (debouncedTimerRef.current) {
        window.clearTimeout(debouncedTimerRef.current);
        debouncedTimerRef.current = null;
      }
      return;
    }
    // debounce updates to reduce iframe reload frequency but keep it fast for streaming
    if (debouncedTimerRef.current) window.clearTimeout(debouncedTimerRef.current);
    debouncedTimerRef.current = window.setTimeout(() => {
      setDebouncedContent(streamedContent);
      debouncedTimerRef.current = null;
    }, 100); // shorter debounce for more immediate markdown updates
    return () => {
      if (debouncedTimerRef.current) {
        window.clearTimeout(debouncedTimerRef.current);
        debouncedTimerRef.current = null;
      }
    };
  }, [streamedContent, streaming]);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (open && !streaming && !finalData && !error) {
      startStreaming();
    }
  }, [open]);

  async function startStreaming() {
    setError(null);
    setStreaming(true);
    setStreamedContent("");
    setFinalData(null);
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const opts: any = {
      date,
      topic,
      speaker,
      signal: controller.signal,
      onUpdate: (text: string) => {
        // compute appended fragment (best-effort) for debug and incremental display
        setStreamedContent((prev) => {
          try {
            const appended = text.startsWith(prev) ? text.slice(prev.length) : text;
            if (appended && appended.trim()) {
              setLastFragments((p) => {
                const next = [...p, appended.trim()].slice(-12);
                return next;
              });
            }
          } catch (e) {}
          return text;
        });
      },
      onFinal: (data: any) => {
        setFinalData(data);
        setStreamedContent(""); // Clear preview
        setStreaming(false);
      },
      onError: (err: any) => {
        setError(err);
        setStreaming(false);
      },
      onComplete: () => {
        setStreaming(false);
      },
    };

    await readFullDebateStream(opts);
  }

  function handleCopy() {
    const textToCopy = finalData?.full_context || streamedContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStreaming(false);
    setStreamedContent("");
    setFinalData(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {finalData?.title || "Full Debate"}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {finalData?.speaker || speaker} — {finalData?.date || date}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : streaming ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Streaming live...</span>
              </div>

              {/* Markdown-rendered preview (updates quickly while streaming) */}
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={debouncedContent} darkMode={false} />
              </div>

              {/* debug UI removed per user request */}
            </div>
          ) : finalData ? (
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={finalData.full_context || finalData.summary || ""} darkMode={false} />
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12">
              No content available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 rounded-b-xl">
          <button
            onClick={handleClose}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}