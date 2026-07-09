import { useEffect } from "react";
import { useSurvivorProfile } from "@/hooks/useSurvivorProfile";

/**
 * Applies survivor accessibility preferences as classes on <html>.
 * Mounted once near the App root. Side-effect only — renders nothing.
 *
 * The classes are styled in client/src/index.css under the "Survivor a11y"
 * block. We toggle on <html> (not <body>) so styles cascade through portals
 * (Radix dialogs, toasts) too.
 */
export default function AccessibilityProvider() {
  const { profile } = useSurvivorProfile();

  useEffect(() => {
    const root = document.documentElement;
    const setClass = (cls: string, on: boolean) => {
      if (on) root.classList.add(cls);
      else root.classList.remove(cls);
    };
    setClass("a11y-big-button", !!profile?.bigButtonMode);
    setClass("a11y-dyslexia-font", !!profile?.dyslexiaFont);
    setClass("a11y-reduce-motion", !!profile?.reducedMotion);
  }, [
    profile?.bigButtonMode,
    profile?.dyslexiaFont,
    profile?.reducedMotion,
  ]);

  return null;
}
