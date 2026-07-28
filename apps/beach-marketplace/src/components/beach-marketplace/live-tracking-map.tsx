"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Clock, IceCream } from "lucide-react";
import { calculateDistance } from "@/lib/beach-marketplace/geolocation";

interface LiveTrackingMapProps {
  ambulanteLat: number;
  ambulanteLon: number;
  clienteLat: number;
  clienteLon: number;
  etaMinutos?: number;
}

/**
 * Rastreamento em tempo real (mockado): anima o ambulante se aproximando
 * do cliente ao longo de ~45s, atualizando distância e ETA a cada segundo.
 */
export function LiveTrackingMap({
  ambulanteLat,
  ambulanteLon,
  clienteLat,
  clienteLon,
  etaMinutos = 8,
}: LiveTrackingMapProps) {
  // posição inicial do ambulante fica fixa durante toda a animação
  const startRef = useRef({ lat: ambulanteLat, lon: ambulanteLon });
  const [t, setT] = useState(0);

  useEffect(() => {
    const durationMs = 45000;
    const started = Date.now();
    const id = setInterval(() => {
      const next = Math.min(1, (Date.now() - started) / durationMs);
      setT(next);
      if (next >= 1) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const curLat = startRef.current.lat + (clienteLat - startRef.current.lat) * t;
  const curLon = startRef.current.lon + (clienteLon - startRef.current.lon) * t;

  const distancia = calculateDistance(curLat, curLon, clienteLat, clienteLon);
  const etaRestante = Math.max(1, Math.round(etaMinutos * (1 - t)));
  const chegou = t >= 1;

  // normaliza as coordenadas para posicionar os marcadores no mini-mapa
  const lats = [startRef.current.lat, clienteLat];
  const lons = [startRef.current.lon, clienteLon];
  const padLat = Math.max(0.0006, (Math.max(...lats) - Math.min(...lats)) * 0.4);
  const padLon = Math.max(0.0006, (Math.max(...lons) - Math.min(...lons)) * 0.4);
  const minLat = Math.min(...lats) - padLat;
  const maxLat = Math.max(...lats) + padLat;
  const minLon = Math.min(...lons) - padLon;
  const maxLon = Math.max(...lons) + padLon;
  const toXY = (lat: number, lon: number) => ({
    x: ((lon - minLon) / (maxLon - minLon)) * 100,
    y: ((maxLat - lat) / (maxLat - minLat)) * 100,
  });
  const cli = toXY(clienteLat, clienteLon);
  const amb = toXY(curLat, curLon);

  return (
    <div className="space-y-2">
      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border bg-gradient-to-b from-sky-100 via-amber-50 to-amber-100">
        {/* faixa de água */}
        <div className="absolute inset-x-0 top-0 h-1/3 bg-sky-200/50" />
        {/* grid sutil */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* rota */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line
            x1={`${amb.x}%`}
            y1={`${amb.y}%`}
            x2={`${cli.x}%`}
            y2={`${cli.y}%`}
            stroke="#0d9aa8"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
        </svg>
        {/* cliente */}
        <div
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${cli.x}%`, top: `${cli.y}%` }}
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-loslos-teal-dark bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm mb-0.5 whitespace-nowrap">
              Você
            </span>
            <MapPin className="w-6 h-6 text-red-500 drop-shadow" fill="currentColor" />
          </div>
        </div>
        {/* ambulante */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
          style={{ left: `${amb.x}%`, top: `${amb.y}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-loslos-teal-dark text-white flex items-center justify-center shadow-lg ring-4 ring-loslos-teal/30">
            <IceCream className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Navigation className="w-4 h-4 text-loslos-teal" />
          {chegou ? "Chegou! Procure o ambulante" : `${Math.round(distancia)} m de você`}
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Clock className="w-4 h-4 text-loslos-teal" />
          {chegou ? "Agora" : `~${etaRestante} min`}
        </span>
      </div>
    </div>
  );
}
