// src/app/page.tsx
'use client'; // because we're using a client-side hook

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/messaging');
  }, [router]);

  return null; // or a loading spinner
}
