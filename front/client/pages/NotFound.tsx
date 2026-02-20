import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Page non trouvée</h1>
        <p className="text-muted-foreground mt-1">
          La page que vous recherchez n'existe pas
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-8 text-center space-y-6">
        <div className="text-6xl font-bold text-muted-foreground">404</div>
        <p className="text-foreground font-medium">
          Oups! Cette page n'existe pas
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
