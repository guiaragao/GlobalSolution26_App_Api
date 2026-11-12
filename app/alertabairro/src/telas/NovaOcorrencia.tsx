// Funcionalidade 1: registrar ocorrência (tipo, descrição, foto e GPS).

import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Botao from '../componentes/Botao';
import Campo from '../componentes/Campo';
import Cartao from '../componentes/Cartao';
import Chip from '../componentes/Chip';
import { criarOcorrencia } from '../servicos/api';
import { obterLocalizacao } from '../servicos/localizacao';
import { cores, espaco, fonte } from '../tema';

const TIPOS = ['Alagamento', 'Árvore caída', 'Sem luz', 'Deslizamento'];

export default function NovaOcorrencia() {
  const nav = useNavigation<any>();
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [descricao, setDescricao] = useState('');
  const [fotoUri, setFotoUri] = useState<string | undefined>();
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function tirarFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize a câmera para anexar uma foto.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (r.canceled) return;
    // Gerenciamento de memória/rede: reduz a foto antes de guardar e enviar.
    const menor = await ImageManipulator.manipulateAsync(
      r.assets[0].uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
    );
    setFotoUri(menor.uri);
  }

  async function enviar() {
    if (descricao.trim().length < 5) {
      setErro('Descreva o que está acontecendo (mínimo 5 letras).');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      const pos = await obterLocalizacao();
      await criarOcorrencia({ tipo, descricao: descricao.trim(), fotoUri, ...pos });
      Alert.alert('Ocorrência registrada', 'Obrigado por avisar o bairro.');
      nav.goBack();
    } catch {
      Alert.alert('Não foi possível enviar', 'Verifique sua conexão e tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.tela} contentContainerStyle={{ padding: espaco.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.rotulo}>Tipo</Text>
        <View style={styles.linha}>
          {TIPOS.map((t) => (
            <Chip key={t} rotulo={t} ativo={tipo === t} onPress={() => setTipo(t)} />
          ))}
        </View>

        <Campo rotulo="Descrição" value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} style={{ minHeight: 90, textAlignVertical: 'top', paddingTop: espaco.sm }} placeholder="Descreva o que está acontecendo" erro={erro} />

        <Cartao onPress={tirarFoto} estilo={{ alignItems: 'center' }}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.foto} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={28} color={cores.primaria} />
              <Text style={styles.sub}>Adicionar foto</Text>
            </>
          )}
        </Cartao>

        <Cartao>
          <Text style={styles.sub}>
            <Ionicons name="locate-outline" size={14} /> A localização atual (GPS) será anexada ao enviar.
          </Text>
        </Cartao>

        <Botao titulo="Enviar ocorrência" onPress={enviar} carregando={enviando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  rotulo: { fontSize: fonte.pequena, color: cores.textoSecundario, marginBottom: espaco.xs },
  linha: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: espaco.sm },
  sub: { fontSize: fonte.pequena, color: cores.textoSecundario, marginTop: 2 },
  foto: { width: '100%', height: 150, borderRadius: 8 },
});
