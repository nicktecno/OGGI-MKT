/**
 * Utilitários de Geolocalização
 * Calcula distâncias e encontra ambulantes mais próximos
 */

import { Ambulante, DistanceResult, GeoLocation } from "./types";

/**
 * Calcula distância em metros entre dois pontos usando a fórmula de Haversine
 * Retorna a distância em metros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converte graus para radianos
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Encontra os ambulantes mais próximos, filtrados por status
 * Retorna lista ordenada por distância
 */
export function findNearestAmbulantes(
  clienteLat: number,
  clienteLon: number,
  ambulantes: Ambulante[],
  maxResults: number = 5
): DistanceResult[] {
  // Filtra apenas ambulantes disponíveis
  const disponibles = ambulantes.filter(
    (a) => a.status === "DISPONIVEL" && a.estoque > 0
  );

  // Calcula distância para cada ambulante
  const withDistances = disponibles.map((ambulante) => ({
    ambulante,
    ambulanteId: ambulante.id,
    distance: calculateDistance(
      clienteLat,
      clienteLon,
      ambulante.latitude,
      ambulante.longitude
    ),
  }));

  // Ordena por distância (mais próximo primeiro)
  return withDistances.sort((a, b) => a.distance - b.distance).slice(0, maxResults);
}

/**
 * Obtém a localização do navegador
 */
export function getCurrentLocation(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    // Geolocalização só funciona em contexto seguro (HTTPS ou localhost).
    // Ao acessar por um IP de rede via http://, `navigator.geolocation`
    // fica indisponível e o navegador nem chega a exibir o popup.
    if (
      typeof window !== "undefined" &&
      window.isSecureContext === false
    ) {
      reject(new Error("INSECURE_CONTEXT"));
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error("INSECURE_CONTEXT"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Converte um erro de geolocalização em uma mensagem amigável em pt-BR.
 */
export function getGeolocationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "INSECURE_CONTEXT") {
    return "A localização só funciona em conexão segura (HTTPS) ou em localhost. Abra o site por HTTPS para permitir a localização.";
  }

  // GeolocationPositionError: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
  const code = (error as { code?: number })?.code;
  if (code === 1) {
    return "Permissão de localização negada. Ative a localização para este site nas configurações do navegador e tente novamente.";
  }
  if (code === 2) {
    return "Não foi possível obter sua localização. Verifique se o GPS/localização do dispositivo está ativado e tente novamente.";
  }
  if (code === 3) {
    return "Tempo esgotado ao obter a localização. Tente novamente.";
  }

  return "Precisamos da sua localização para enviar o pedido ao ambulante. Ative o compartilhamento de localização e tente novamente.";
}

/**
 * Monitora a localização em tempo real
 * Útil para atualizar a posição do cliente durante o pedido
 */
export function watchLocation(
  onLocationChange: (location: GeoLocation) => void,
  onError: (error: GeolocationPositionError) => void
): number {
  if (!navigator.geolocation) {
    throw new Error("Geolocalização não suportada");
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onLocationChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
      });
    },
    onError,
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000,
    }
  );
}

/**
 * Para de monitorar a localização
 */
export function stopWatchingLocation(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}

/**
 * Formata distância em m ou km
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Verifica se o cliente está dentro do raio da praia
 */
export function isWithinBeachRadius(
  clienteLat: number,
  clienteLon: number,
  beachLat: number,
  beachLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(clienteLat, clienteLon, beachLat, beachLon);
  return distance <= radiusMeters;
}
