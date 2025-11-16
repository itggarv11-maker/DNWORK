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

        // The render function that will be called once KaTeX is ready.
        const render = () => {
            if (containerRef.current && window.renderMathInElement) {
                try {
                    // Set the text content first
                    containerRef.current.textContent = text;
                    // Then, let KaTeX process the element
                    window.renderMathInElement(containerRef.current, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ],
                        throwOnError: false
                    });
                } catch (e) {
                    console.error("KaTeX rendering error:", e);
                    // Fallback to text content if rendering fails
                    if(containerRef.current) containerRef.current.textContent = text;
                }
            }
        };

        // Set text immediately for non-JS or if KaTeX fails
        container.textContent = text;

        // If KaTeX is already available, render immediately.
        if (window.renderMathInElement) {
            render();
        } else {
            // Otherwise, wait for our custom 'katexready' event from index.html
            window.addEventListener('katexready', render, { once: true });
        }
        
        // Cleanup the event listener when the component unmounts.
        return () => {
            window.removeEventListener('katexready', render);
        };
    }, [text]);

    return <span ref={containerRef} className={className} />;
};

export default MathRenderer;