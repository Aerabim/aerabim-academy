'use client';

import { useState, useEffect, useCallback } from 'react';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/favorites');
        if (!res.ok) return;
        const data = await res.json() as { courseIds: string[] };
        if (!cancelled) {
          setFavoriteIds(new Set(data.courseIds));
          setLoaded(true);
        }
      } catch {
        // silently fail
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback(async (courseId: string) => {
    const prev = new Set(favoriteIds);
    const next = new Set(favoriteIds);

    if (next.has(courseId)) {
      next.delete(courseId);
    } else {
      next.add(courseId);
    }
    setFavoriteIds(next);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        setFavoriteIds(prev);
      }
    } catch {
      setFavoriteIds(prev);
    }
  }, [favoriteIds]);

  return { favoriteIds, loaded, toggle };
}
