// Utilitários de geolocalização.

export interface Coordenada {
  latitude: number;
  longitude: number;
}

// Coordenada padrão usada quando o GPS não está disponível (centro de São Paulo).
export const COORDENADA_PADRAO: Coordenada = { latitude: -23.5505, longitude: -46.6333 };

// Distância em km entre duas coordenadas (fórmula de Haversine).
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Formata a distância: "600 m" ou "1,2 km".
export function formatarDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

// Tempo decorrido em texto curto: "há 20 min".
export function tempoDecorrido(iso: string): string {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}
