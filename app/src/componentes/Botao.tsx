// Botão grande e acessível, com 4 variantes.

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, espaco, fonte, raio } from '../tema';

type Variante = 'primario' | 'secundario' | 'sucesso' | 'perigo';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icone?: keyof typeof Ionicons.glyphMap;
  carregando?: boolean;
  estilo?: ViewStyle;
}

function BotaoBase({ titulo, onPress, variante = 'primario', icone, carregando, estilo }: Props) {
  const secundario = variante === 'secundario';
  const fundo = {
    primario: cores.primaria,
    secundario: cores.cartao,
    sucesso: cores.sucesso,
    perigo: cores.perigo,
  }[variante];
  const corTexto = secundario ? cores.texto : cores.textoSobreCor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      onPress={onPress}
      disabled={carregando}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: fundo, opacity: pressed || carregando ? 0.8 : 1 },
        secundario && styles.borda,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          {icone && <Ionicons name={icone} size={20} color={corTexto} style={{ marginRight: espaco.sm }} />}
          <Text style={[styles.texto, { color: corTexto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

// React.memo: só re-renderiza se as props mudarem.
export default React.memo(BotaoBase);

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: raio.botao,
    paddingHorizontal: espaco.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  borda: { borderWidth: 1, borderColor: cores.borda },
  texto: { fontSize: fonte.normal, fontWeight: '600' },
});
