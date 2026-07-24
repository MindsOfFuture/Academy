"use client";

import { useEffect } from "react";
import { trackingService } from "@/lib/services/tracking.service";

/**
 * Componente client-side que inicializa e destrói o TrackingService.
 * Deve ser colocado no layout principal (app/layout.tsx).
 *
 * Não renderiza nada visualmente.
 */
export default function TrackingProvider() {
  useEffect(() => {
    trackingService.init();
    return () => {
      trackingService.destroy();
    };
  }, []);

  return null;
}
