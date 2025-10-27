import React, { useEffect, useRef, useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  darkMode?: boolean;
  isUserMessage?: boolean;
}

// Create an HTML document (srcDoc) that mirrors the original WebView template.
// The iframe will post messages to the parent for height, copy and link events.
const createMarkdownHTML = (content: string, darkMode: boolean, isUserMessage = false) => {
  // Minimal preprocessing to avoid breaking template interpolation
    const encoded = encodeURIComponent(String(content || ''));

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${darkMode ? 'github-dark' : 'github'}.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:${isUserMessage? '8px':'16px'};color:${darkMode? '#fff':'#000'}}
    .code-copy-button{cursor:pointer}
    pre{overflow:auto}
    a{color:#FFA200}
  </style>
</head>
<body>
  <div id="content"></div>

  <script src="https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  <script>
    // basic marked options
    marked.setOptions({gfm:true, breaks:true});

    function escapeHtml(unsafe){return String(unsafe).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

    const renderer = new marked.Renderer();
    renderer.code = function(code, infostring, escaped){
      const lang = (infostring||'').match(/\S*/)?.[0] || '';
      const esc = escaped ? code : escapeHtml(code);
      return (
        '<div class="code-block-container">' +
          '<div class="code-block-header">' +
            '<span class="code-language">' + lang + '</span>' +
            '<button class="code-copy-button" data-code="' + esc.replace(/"/g,'&quot;') + '">Copy</button>' +
          '</div>' +
          '<pre><code class="hljs ' + (lang ? 'language-' + lang : '') + '">' + esc + '</code></pre>' +
        '</div>'
      );
    };

  const content = decodeURIComponent("${encoded}");
    const html = marked.parse(content, { renderer });
    document.getElementById('content').innerHTML = html;

    // highlight
    document.querySelectorAll('pre code').forEach((el)=>{try{hljs.highlightElement(el)}catch(e){}});

    // render math
    try{renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false})}catch(e){}

    // copy button handling and link handling
    document.addEventListener('click',function(e){
      const t = e.target;
      if(t && t.classList && t.classList.contains('code-copy-button')){
        const code = t.getAttribute('data-code') || '';
        // send copy message
        window.parent.postMessage(JSON.stringify({type:'copy', text: code}), '*');
        t.textContent = 'Copied!';
        setTimeout(()=>{t.textContent='Copy'},2000);
        return e.preventDefault();
      }
      const a = e.target.closest && e.target.closest('a');
      if(a && a.href && a.href.startsWith('http')){
        e.preventDefault();
        window.parent.postMessage(JSON.stringify({type:'link', url: a.href}), '*');
      }
    }, false);

    // post initial height and on resize
    function sendHeight(){
      const h = document.body.scrollHeight || document.documentElement.scrollHeight;
      window.parent.postMessage(JSON.stringify({type:'height', height: h}), '*');
    }
    setTimeout(sendHeight, 100);
    window.addEventListener('resize', sendHeight);
    const obs = new MutationObserver(sendHeight); obs.observe(document.body,{childList:true,subtree:true});
  </script>
</body>
</html>`;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, darkMode = false, isUserMessage = false }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number>(200);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      try {
        const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'height' && typeof data.height === 'number') {
          setHeight(Math.max(50, data.height));
        }
        if (data.type === 'copy' && typeof data.text === 'string') {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(data.text).catch(()=>{});
          }
        }
        if (data.type === 'link' && typeof data.url === 'string') {
          window.open(data.url, '_blank', 'noopener');
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const srcDoc = createMarkdownHTML(content || '', !!darkMode, !!isUserMessage);

  return (
    <iframe
      ref={iframeRef}
      title="markdown-renderer"
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      style={{ width: '100%', height, border: '0', overflow: 'hidden' }}
      scrolling="no"
    />
  );
};

export { MarkdownRenderer };