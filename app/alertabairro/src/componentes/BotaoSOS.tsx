// Botão SOS flutuante: registra um check-in "preciso de ajuda" com a localização atual.

import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { enviarCheckin } from '../servicos/api';
import { obterLocalizacao } from '../servicos/localizacao';
import { cores } from '../tema';

export default function BotaoSOS() {
  const acionar = useCallback(async () => {
    try {
      const pos = await obterLocalizacao();
      await enviarCheckin('preciso_de_ajuda', pos);
      Alert.alert('Pedido de ajuda enviado', 'Sua localização foi registrada.');
    } catch {
      Alert.alert('Não foi possível enviar', 'Verifique sua conexão e tente de novo.');
    }
  }, []);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="SOS, pedir ajuda agora" onPress={acionar} style={styles.botao}>
      <Text style={styles.texto}>SOS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: cores.perigo,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  texto: { color: cores.textoSobreCor, fontWeight: '700', fontSize: 16 },
});
