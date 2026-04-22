import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MetaManagerProps {
  title?: string;
  description?: string;
}

export function MetaManager({ title, description }: MetaManagerProps) {
  const location = useLocation();
  const suffix = "RCCG EMMANUEL SANTUARY";

  useEffect(() => {
    // Construct title
    const fullTitle = title ? `${title} | ${suffix}` : suffix;
    document.title = fullTitle;

    // Update description if provided
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }
  }, [title, description, location]);

  return null;
}
