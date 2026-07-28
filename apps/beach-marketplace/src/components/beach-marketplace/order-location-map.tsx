"use client";

import { MapPin, Navigation } from "lucide-react";

interface OrderLocationMapProps {
  lat: number;
  lon: number;
}

/**
 * Mostra a localização do cliente em um mapa embutido (OpenStreetMap, sem API key).
 * O mapa aparece sempre visível e inclui um link para abrir a rota no Google Maps.
 */
export function OrderLocationMap({ lat, lon }: OrderLocationMapProps) {
  const delta = 0.004;
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  return (
    <div className="rounded-lg bg-primary/10 overflow-hidden mb-3">
      <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-foreground">
        <MapPin className="w-3.5 h-3.5 text-loslos-teal flex-shrink-0" />
        <span className="truncate">
          Localização do cliente: {lat.toFixed(4)}, {lon.toFixed(4)}
        </span>
      </div>

      <iframe
        title="Mapa da localização do cliente"
        src={embedUrl}
        className="w-full h-48 border-0 block"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={gmapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 py-2 text-xs font-semibold text-loslos-teal hover:underline"
      >
        <Navigation className="w-3.5 h-3.5" />
        Abrir rota no Google Maps
      </a>
    </div>
  );
}
