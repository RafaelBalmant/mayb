"use client";
import { useEffect, useState } from "react";

// The tagline fades in slowly only the first time the start page appears in this visit (coming back from the
// agenda does not repeat it). The page's own HTML always has the animation, as the first visit expects.
let shown = false;

export function Tagline({ text }) {
  const [animate] = useState(() => !shown);
  useEffect(() => {
    shown = true;
  }, []);
  return <p className={animate ? "profile-tagline appear" : "profile-tagline"}>{text}</p>;
}
