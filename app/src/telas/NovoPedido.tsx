// Funcionalidade 3: criar um pedido ou uma oferta de ajuda.

import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Botao from '../componentes/Botao';
import Campo from '../componentes/Campo';
import Chip from '../componentes/Chip';
import { ModoAjuda, NovoPedido as NovoPedidoDados } from '../modelos';
import { criarPedido } from '../servicos/api';
import { cores, espaco, fonte } from '../tema';

const CATEGORIAS = ['Remédio', 'Transporte', 'Abrigo', 'Outros'];
const URGENCIAS: { valor: NovoPedidoDados['urgencia']; rotulo: string }[] = [
  { valor: 'baixa', rotulo: 'Baixa' },
  { valor: 'media', rotulo: 'Média' },
  { valor: 'alta', rotulo: 'Alta' },
];

export default function NovoPedido() {
  const nav = useNavigation<any>();
  const [modo, setModo] = useState<ModoAjuda>('pedido');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [descricao, setDescricao] = useState('');
  const [urgencia, setUrgencia] = useState<NovoPedidoDados['urgencia']>('media');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (descricao.trim().length < 5) {
      setErro('Explique o que você precisa ou pode oferecer (mínimo 5 letras).');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      await criarPedido({ modo, categoria, descricao: descricao.trim(), urgencia });
      Alert.alert('Publicado', modo === 'pedido' ? 'Seu pedido foi publicado.' : 'Sua oferta foi publicada.');
      nav.goBack();
    } catch {
      Alert.alert('Não foi possível publicar', 'Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.tela} contentContainerStyle={{ padding: espaco.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.rotulo}>Eu quero</Text>
        <View style={styles.linha}>
          <Chip rotulo="Pedir ajuda" ativo={modo === 'pedido'} onPress={() => setModo('pedido')} />
          <Chip rotulo="Oferecer ajuda" ativo={modo === 'oferta'} onPress={() => setModo('oferta')} />
        </View>

        <Text style={styles.rotulo}>Categoria</Text>
        <View style={styles.linha}>
          {CATEGORIAS.map((c) => (
            <Chip key={c} rotulo={c} ativo={categoria === c} onPress={() => setCategoria(c)} />
          ))}
        </View>

        <Campo rotulo="Descrição" value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} style={{ minHeight: 90, textAlignVertical: 'top', paddingTop: espaco.sm }} placeholder="Explique em poucas palavras" erro={erro} />

        <Text style={styles.rotulo}>Urgência</Text>
        <View style={styles.linha}>
          {URGENCIAS.map((u) => (
            <Chip key={u.valor} rotulo={u.rotulo} ativo={urgencia === u.valor} onPress={() => setUrgencia(u.valor)} />
          ))}
        </View>

        <Botao titulo="Publicar" onPress={enviar} carregando={enviando} estilo={{ marginTop: espaco.md }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  rotulo: { fontSize: fonte.pequena, color: cores.textoSecundario, marginBottom: espaco.xs },
  linha: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: espaco.sm },
});
