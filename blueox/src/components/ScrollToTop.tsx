import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// react-router's BrowserRouter doesn't reset window scroll position on
// navigation (unlike a traditional multi-page site) — without this, a new
// page opens at whatever scroll depth the previous page was left at.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
