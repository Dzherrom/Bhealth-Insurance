'use client';

import { useEffect } from 'react';
import { setupTokenInterceptor } from '@/lib/api';

export function AuthInit() {
  useEffect(() => {
    setupTokenInterceptor();
  }, []);

  return null;
}
