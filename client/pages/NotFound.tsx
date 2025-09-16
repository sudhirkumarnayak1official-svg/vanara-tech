import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Shell } from "@/components/layout/Shell";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Shell>
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center soft-panel p-8">
          <h1 className="text-4xl font-display neon-text mb-4">404</h1>
          <p className="text-sm text-muted-foreground mb-4">Page not found</p>
          <a href="/" className="text-primary underline">Return to Home</a>
        </div>
      </div>
    </Shell>
  );
};

export default NotFound;
