import { onlyCepDigits } from "@/lib/viacep";

type NominatimReverse = {
  address?: {
    postcode?: string;
  };
};

/** Reverse geocode (OpenStreetMap Nominatim) → CEP com 8 dígitos. */
export async function fetchCepFromCoords(lat: number, lon: number): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "Accept-Language": "pt-BR,pt;q=0.9" },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as NominatimReverse;
  const postcode = data.address?.postcode;
  if (typeof postcode !== "string") return null;

  const digits = onlyCepDigits(postcode);
  return digits.length === 8 ? digits : null;
}

export function requestGeolocationPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalização indisponível"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 60_000,
    });
  });
}

/** Obtém CEP a partir da localização do navegador. */
export async function fetchCepFromGeolocation(): Promise<string> {
  const pos = await requestGeolocationPosition();
  const cep = await fetchCepFromCoords(pos.coords.latitude, pos.coords.longitude);
  if (!cep) throw new Error("CEP não encontrado para esta localização");
  return cep;
}
