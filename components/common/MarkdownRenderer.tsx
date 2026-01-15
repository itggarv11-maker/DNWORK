import React from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9.0.1';
import remarkGfm from 'https://esm.sh/remark-gfm@4.0.0';
import MathRenderer from './MathRenderer';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  return (
    <div className={`prose prose-invert max-w-none prose-slate prose-p:leading-relaxed prose-headings:text-white prose-strong:text-violet-400 prose-ul:list-disc prose-ol:list-decimal ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // We wrap text nodes to check for LaTeX, or let MathRenderer handle specific blocks
          p: ({ children }) => {
            if (typeof children === 'string') {
              return <p><MathRenderer text={children} /></p>;
            }
            return <p>{children}</p>;
          },
          li: ({ children }) => {
            if (typeof children === 'string') {
              return <li><MathRenderer text={children} /></li>;
            }
            return <li>{children}</li>;
          },
          // Custom handling for headings to ensure they look futuristic
          h1: ({ children }) => <h1 className="text-2xl font-black uppercase tracking-tighter text-white border-l-4 border-violet-500 pl-4 my-6">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold uppercase tracking-tight text-slate-100 mt-8 mb-4">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold text-violet-300 mt-6 mb-2">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;