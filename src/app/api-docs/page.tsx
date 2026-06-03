'use client';

import { useEffect, useRef } from 'react';
import { withBasePath } from '@/lib/basePath';

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Swagger UI from CDN
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.onload = () => {
      // @ts-expect-error SwaggerUIBundle is loaded from CDN
      if (window.SwaggerUIBundle && containerRef.current) {
        // @ts-expect-error SwaggerUIBundle is loaded from CDN
        window.SwaggerUIBundle({
          url: withBasePath('/api/docs/spec'),
          domNode: containerRef.current,
          deepLinking: true,
          presets: [
            // @ts-expect-error SwaggerUIBundle is loaded from CDN
            window.SwaggerUIBundle.presets.apis,
            // @ts-expect-error SwaggerUIBundle is loaded from CDN
            window.SwaggerUIBundle.SwaggerUIStandalonePreset,
          ],
          layout: 'BaseLayout',
          defaultModelsExpandDepth: -1,
          docExpansion: 'list',
          filter: true,
          tryItOutEnabled: false,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div ref={containerRef} id="swagger-ui" />
    </div>
  );
}
