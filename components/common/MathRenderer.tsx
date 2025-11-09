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
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Set the innerHTML to render any HTML tags from the AI (like <strong>)
        // This is safe because we trust the content coming from the Gemini API.
        container.innerHTML = text;

        if (window.renderMathInElement) {
            // A minimal delay can help ensure the DOM is fully updated before KaTeX runs.
            setTimeout(() => {
                if (containerRef.current) { // Re-check if component is still mounted
                    try {
                        // Now, run KaTeX on the rendered content
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
                    }
                }
            }, 0);
        }
    }, [text]);

    // Use a div to correctly contain potentially block-level HTML from Gemini.
    // The parent component can control layout (e.g., `inline-block`).
    return <div ref={containerRef} className={className} />;
};

export default MathRenderer;
