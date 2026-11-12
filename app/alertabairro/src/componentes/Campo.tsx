// Campo de texto com rótulo e mensagem de erro.

import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { cores, espaco, fonte, raio } from '../tema';

interface Props extends TextInputProps {
  rotulo: string;
  erro?: string;
}

export default function Campo({ rotulo, erro, style, ...resto }: Props) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoSecundario}
        style={[styles.input, erro ? styles.inputErro : null, style]}
        {...resto}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { marginBottom: espaco.md },
  rotulo: { fontSize: fonte.pequena, color: cores.textoSecundario, marginBottom: espaco.xs },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.botao,
    paddingHorizontal: espaco.md,
    backgroundColor: cores.cartao,
    color: cores.texto,
    fontSize: fonte.normal,
  },
  inputErro: { borderColor: cores.perigo },
  erro: { color: cores.perigo, fontSize: fonte.pequena, marginTop: espaco.xs },
});
