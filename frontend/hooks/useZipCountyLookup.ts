'use client';

import { useCallback, useState } from 'react';
import { API_BASE_URL, getCurrentToken } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export interface ZipLookupResult {
  city: string;
  state: string;
  counties: string[];
}

export async function lookupZipCounty(zip: string): Promise<ZipLookupResult | null> {
  const normalized = zip.trim();
  if (normalized.length < 5) return null;

  const token = getCurrentToken();
  const res = await fetch(`${API_BASE_URL}/utils/zipcode/${normalized}/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return null;

  const data = await res.json();
  return {
    city: data.city || '',
    state: data.state || data.state_abbr || '',
    counties: Array.isArray(data.counties) ? data.counties : [],
  };
}

export function useZipCountyLookup() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [counties, setCounties] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const resolveZip = useCallback(
    async (zip: string, preferredCondado?: string) => {
      const normalized = zip.trim();
      if (normalized.length < 5) {
        setCounties([]);
        return null;
      }

      setLoading(true);
      try {
        const token = accessToken || getCurrentToken();
        const res = await fetch(`${API_BASE_URL}/utils/zipcode/${normalized}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          setCounties([]);
          return null;
        }
        const data = await res.json();
        const nextCounties: string[] = Array.isArray(data.counties) ? data.counties : [];
        setCounties(nextCounties);

        const autoCondado =
          preferredCondado?.trim() ||
          (nextCounties.length === 1 ? nextCounties[0] : '');

        return {
          zip_code: normalized,
          ciudad: data.city || '',
          estado: data.state || data.state_abbr || '',
          condado: autoCondado,
          counties: nextCounties,
        };
      } catch {
        setCounties([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  return { counties, setCounties, loading, resolveZip };
}
