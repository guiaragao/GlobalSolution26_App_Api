// Tela inicial (boas-vindas), separada do login e do cadastro.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Botao from '../componentes/Botao';
import { cores, espaco, fonte } from '../tema';

export default function Inicio() {
  const nav = useNavigation<any>();
  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.centro}>
        <Text style={styles.nome}>AlertaBairro</Text>
        <Text style={styles.lema}>Seu bairro mais seguro, junto com você</Text>
      </View>
      <View style={styles.botoes}>
        <Botao titulo="Entrar" onPress={() => nav.navigate('Login')} />
        <Botao titulo="Criar conta" variante="secundario" onPress={() => nav.navigate('Cadastro')} estilo={{ marginTop: espaco.md }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, padding: espaco.xl },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: fonte.grande + 4, fontWeight: '700', color: cores.texto },
  lema: { fontSize: fonte.normal, color: cores.textoSecundario, marginTop: espaco.sm, textAlign: 'center' },
  botoes: { paddingBottom: espaco.xl },
});
