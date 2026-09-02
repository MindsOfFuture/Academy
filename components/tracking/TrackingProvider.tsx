"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackingService } from "@/lib/services/tracking.service";

/**
 * Componente client-side que inicializa e destrói o TrackingService.
 * Deve ser colocado no layout principal (app/layout.tsx).
 *
 * Não renderiza nada visualmente.
 */
export default function TrackingProvider() {
  const pathname = usePathname();

  useEffect(() => {
    trackingService.init();
    return () => {
      trackingService.destroy();
    };
  }, []);

  useEffect(() => {
    if (pathname) void trackingService.trackLearningEvent("page_viewed", { route: pathname });
  }, [pathname]);

  return null;
}
