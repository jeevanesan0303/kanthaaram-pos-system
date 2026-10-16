import React, { useEffect, useState } from 'react';
export const OfflineBanner: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  if (online) return null;
  return <div role="alert" className="fixed top-0 left-0 right-0 z-[9999] bg-red-800 text-white text-center text-sm font-bold p-2">OFFLINE — Product cache and draft cart only. Payments and stock updates are NOT saved to Supabase. Reconnect before confirming bills.</div>;
};
