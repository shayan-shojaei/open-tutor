"use client";
import { useState, useEffect } from "react";

const LS_KEY = "tutor-theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Colors are already correct pre-paint via the inline script in layout.tsx;
  // this only syncs the icon's React state post-hydration to avoid a
  // server/client mismatch (server always renders the "light" default).
  useEffect(() => {
    if (document.documentElement.getAttribute("data-theme") === "dark") setTheme("dark");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(LS_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return { theme, toggle };
}
