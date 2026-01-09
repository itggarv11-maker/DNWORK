
import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        renderMathInElement?: (element: HTMLElement, options: any) => void;
    }
}

interface MathRendererProps {
  text: string;
  className?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ text, className }) => {
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const render = () => {
            if (containerRef.current && window.renderMathInElement) {
                try {
                    containerRef.current.textContent = text;
                    window.renderMathInElement(containerRef.current, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true},
                            {left: '\\ce{', right: '}', display: false}
                        ],
                        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
                        throwOnError: false,
                        trust: true,
                        strict: false
                    });
                } catch (e) {
                    console.error("KaTeX error:", e);
                    if(containerRef.current) containerRef.current.textContent = text;
                }
            }
        };

        container.textContent = text;
        if (window.renderMathInElement) {
            render();
        } else {
            window.addEventListener('katexready', render, { once: true });
        }
        
        return () => window.removeEventListener('katexready', render);
    }, [text]);

    return <span ref={containerRef} className={className} />;
};

export default MathRenderer;
