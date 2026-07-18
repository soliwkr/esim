import { useEffect, useState } from 'react';

export function RuntimeBadge() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  return (
    <span className="runtime-badge" data-react-hydrated={hydrated ? 'true' : 'false'}>
      {hydrated ? 'React island attiva' : 'React island pronta'}
    </span>
  );
}
