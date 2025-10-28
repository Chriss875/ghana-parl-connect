import React from 'react';

interface ContentRendererProps {
  text: string;
  streaming?: boolean;
}

export function ContentRenderer({ text, streaming = false }: ContentRendererProps) {
  if (!text) return null;
  
  // Split by paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return (
    <div className="prose prose-sm max-w-none">
      {paragraphs.map((para, i) => {
        // Check if it's a header
        if (para.startsWith("###")) {
          return (
            <h3 key={i} className="text-lg font-bold mt-6 mb-3">
              {para.replace(/^###\s*/, "")}
            </h3>
          );
        }
        if (para.startsWith("##")) {
          return (
            <h2 key={i} className="text-xl font-bold mt-6 mb-3">
              {para.replace(/^##\s*/, "")}
            </h2>
          );
        }
        
        // Check for bullet points
        if (para.match(/^\s*[\*\-]\s+/)) {
          const items = para.split("\n").filter(line => line.trim());
          return (
            <ul key={i} className="list-disc list-inside space-y-2 my-4">
              {items.map((item, j) => (
                <li key={j} className="ml-4">
                  {item.replace(/^\s*[\*\-]\s+/, "")}
                </li>
              ))}
            </ul>
          );
        }
        
        // Regular paragraph
        return (
          <p key={i} className="mb-4 leading-relaxed">
            {para}
          </p>
        );
      })}
      {streaming && (
        <span className="inline-block w-1 h-4 bg-blue-600 animate-pulse ml-1"></span>
      )}
    </div>
  );
}