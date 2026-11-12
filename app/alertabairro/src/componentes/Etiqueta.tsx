// Etiqueta colorida para status e prioridade.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco } from '../tema';

export type TomEtiqueta = 'perigo' | 'atencao' | 'sucesso' | 'neutro';

const paleta: Record<TomEtiqueta, { fundo: string; texto: string }> = {
  perigo: { fundo: cores.perigoClara, texto: cores.perigo },
  atencao: { fundo: cores.atencaoClara, texto: cores.atencao },
  sucesso: { fundo: cores.sucessoClara, texto: cores.sucesso },
  neutro: { fundo: cores.primariaClara, texto: cores.primaria },
};

function Etiqueta({ texto, tom = 'neutro' }: { texto: string; tom?: TomEtiqueta }) {
  const c = paleta[tom];
  return (
    <View style={[styles.caixa, { backgroundColor: c.fundo }]}>
      <Text style={[styles.texto, { color: c.texto }]}>{texto}</Text>
    </View>
  );
}

export default React.memo(Etiqueta);

const styles = StyleSheet.create({
  caixa: { alignSelf: 'flex-start', paddingHorizontal: espaco.sm, paddingVertical: 2, borderRadius: 10 },
  texto: { fontSize: 12, fontWeight: '600' },
});
