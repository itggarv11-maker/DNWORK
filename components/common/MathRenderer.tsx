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
        if (container && window.renderMathInElement) {
             // A short delay can sometimes help ensure the KaTeX script is fully ready
             setTimeout(() => {
                if (containerRef.current) { // Check if component is still mounted
                    // First, set the raw text content
                    containerRef.current.textContent = text;
                    // Then, render math
                    window.renderMathInElement!(containerRef.current, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ],
                        throwOnError: false
                    });
                }
             }, 10);
        } else if (container) {
            // Fallback if KaTeX is not available
            container.textContent = text;
        }
    }, [text]);

    return <span ref={containerRef} className={className} />;
};

export default MathRenderer;