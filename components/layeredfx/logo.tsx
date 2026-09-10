import { cn } from "@/lib/layeredfx/utils";
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return <a href="#top" aria-label="LayeredFX home" className={cn("lfx-logo", inverted && "lfx-logo-inverted")}>
    <svg viewBox="0 0 36 36" width="34" height="34" fill="none" aria-hidden="true"><path d="M4 11 18 3l14 8-14 8L4 11Z" stroke="currentColor" strokeWidth="1.8" /><path d="m4 19 14 8 14-8M4 27l14 8 14-8" stroke="currentColor" strokeWidth="1.8" /></svg>
    <span>Layered<span className="lfx-logo-fx">FX</span><span className="lfx-logo-dot">.</span></span>
  </a>;
}
