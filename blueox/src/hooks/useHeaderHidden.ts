import { useEffect, useRef, useState } from 'react';

// Shared scroll-direction logic behind the header's hide-on-scroll-down /
// show-on-scroll-up behavior (see SiteHeader.tsx). Exposed as its own hook so
// a page's secondary sticky bar (e.g. Admin.tsx's tabs row, Jobs.tsx's search
// bar) can move in lockstep with the header instead of assuming it's always
// visible at a fixed height — each instance computes the same result
// independently off the same window.scrollY, so no shared state is needed.
export function useHeaderHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;
        if (currentY < 80) {
          setHidden(false);
        } else if (delta > 4) {
          setHidden(true);
        } else if (delta < -4) {
          setHidden(false);
        }
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return hidden;
}
