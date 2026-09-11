import { cn } from "@/lib/layeredfx/utils";
import Image from "next/image";
import { brand } from "@/lib/brand";
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return <a href="#top" aria-label="LayeredFX home" className={cn("lfx-logo", inverted && "lfx-logo-inverted")}>
    <Image src={brand.frontend[inverted ? 'dark' : 'light']} alt="LayeredFX" width={557} height={98} priority style={{ width: 190, height: 'auto' }} />
  </a>;
}
