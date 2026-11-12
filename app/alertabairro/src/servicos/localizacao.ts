// Acesso ao GPS com fallback para uma coordenada padrão.

import * as Location from 'expo-location';
import { COORDENADA_PADRAO, Coordenada } from '../utils/geo';

export async function obterLocalizacao(): Promise<Coordenada> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return COORDENADA_PADRAO;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return COORDENADA_PADRAO;
  }
}
