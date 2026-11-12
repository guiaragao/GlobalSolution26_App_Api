// Chip selecionável, usado em filtros e escolhas (tipo, categoria, urgência).

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { cores, espaco, fonte, raio } from '../tema';

interface Props {
  rotulo: string;
  ativo: boolean;
  onPress: () => void;
}

function Chip({ rotulo, ativo, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      onPress={onPress}
      style={[styles.chip, ativo && styles.ativo]}
    >
      <Text style={[styles.texto, ativo && styles.textoAtivo]}>{rotulo}</Text>
    </Pressable>
  );
}

export default React.memo(Chip);

const styles = StyleSheet.create({
  chip: {
    paddingVertical: espaco.sm,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.chip,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
    marginRight: espaco.sm,
    marginBottom: espaco.sm,
  },
  ativo: { backgroundColor: cores.primariaClara, borderColor: cores.primaria },
  texto: { fontSize: fonte.pequena + 1, color: cores.texto },
  textoAtivo: { color: cores.primaria, fontWeight: '600' },
});
