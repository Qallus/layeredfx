"use client";
import { useEffect, useState, type CSSProperties } from "react";

// Rotates the hero headline on each visit. The server always renders the first one (a stable H1 for search engines);
// the browser then advances to the next in order. The swap happens while the copy is still hidden by the hero animation.
const HEADLINES = [
  { lead: "Wall Wraps & Finishes.", accent: "Save Your Space & Your Savings." },
  { lead: "Custom Interior Finishes.", accent: "Impacting Walls, Not Wallets." },
  { lead: "Wraps, Slats, Paints & Finishes.", accent: "Save Money & Your Space." },
];
const KEY = "lfx-hero-headline";

export function HeroHeadline() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    let next: number;
    try {
      const last = window.localStorage.getItem(KEY);
      next = last === null ? 0 : (Number(last) + 1) % HEADLINES.length;
      if (!Number.isInteger(next)) next = 0;
      window.localStorage.setItem(KEY, String(next));
    } catch {
      next = Math.floor(Math.random() * HEADLINES.length);
    }
    setIndex(next);
  }, []);
  const { lead, accent } = HEADLINES[index];
  // --chars (the longer line) lets the CSS shrink the type so each line stays on one row.
  return <h1 id="hero-title" style={{ "--chars": Math.max(lead.length, accent.length) } as CSSProperties}>{lead}<br /><em>{accent}</em></h1>;
}
