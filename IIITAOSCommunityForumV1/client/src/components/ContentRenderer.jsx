import React, { useEffect, useRef } from 'react';

export default function ContentRenderer({ content, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    //This does render raw HTML content directly to the DOM without sanitization.
    containerRef.current.innerHTML = content;

    //This does find and execute embedded script tags.
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }, [content]);

  return <div ref={containerRef} className={className} />;
}
