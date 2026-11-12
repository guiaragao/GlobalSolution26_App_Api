// Funcionalidade 1: detalhe da ocorrência (foto, prioridade, linha do tempo, confirmação).

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Botao from '../componentes/Botao';
import Cartao from '../componentes/Cartao';
import Etiqueta from '../componentes/Etiqueta';
import { Ocorrencia } from '../modelos';
import { confirmarOcorrencia, listarOcorrencias } from '../servicos/api';
import { cores, espaco, fonte } from '../tema';
import { tempoDecorrido } from '../utils/geo';

export default function Detalhe() {
  const nav = useNavigation<any>();
  const { id } = useRoute<any>().params as { id: number };
  const [o, setO] = useState<Ocorrencia | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;
    listarOcorrencias().then((r) => ativo && setO(r.find((x) => x.id === id) ?? null));
    return () => {
      ativo = false;
    };
  }, [id]);

  async function confirmar() {
    setEnviando(true);
    try {
      setO(await confirmarOcorrencia(id));
      Alert.alert('Obrigado!', 'Seu relato foi somado a esta ocorrência.');
    } catch {
      Alert.alert('Não foi possível confirmar', 'Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  if (!o) return <ActivityIndicator style={{ marginTop: espaco.xl }} color={cores.primaria} />;

  const passos = [
    { ok: true, texto: 'Registrada' },
    { ok: o.prioridade !== 'normal', texto: 'Prioridade elevada' },
    { ok: o.status !== 'aberta', texto: 'Em atendimento' },
    { ok: o.status === 'resolvida', texto: 'Resolvida' },
  ];

  return (
    <ScrollView style={styles.tela} contentContainerStyle={{ padding: espaco.lg }}>
      <View style={styles.foto}>
        {o.fotoUri ? (
          <Image source={{ uri: o.fotoUri }} style={styles.imagem} />
        ) : (
          <Ionicons name="image-outline" size={40} color={cores.primaria} />
        )}
      </View>

      <Text style={styles.titulo}>{o.tipo} · {o.bairro}</Text>
      <Text style={styles.sub}>{tempoDecorrido(o.criadaEm)} · {o.relatos} relatos</Text>
      <View style={{ marginVertical: espaco.sm }}>
        <Etiqueta
          texto={o.prioridade === 'critica' ? 'Prioridade crítica' : o.prioridade === 'alta' ? 'Prioridade alta' : 'Prioridade normal'}
          tom={o.prioridade === 'critica' ? 'perigo' : o.prioridade === 'alta' ? 'atencao' : 'neutro'}
        />
      </View>
      <Text style={styles.descricao}>{o.descricao}</Text>

      <Cartao estilo={{ marginTop: espaco.md }}>
        {passos.map((p) => (
          <View key={p.texto} style={styles.passo}>
            <Ionicons name={p.ok ? 'checkmark-circle' : 'time-outline'} size={20} color={p.ok ? cores.sucesso : cores.atencao} />
            <Text style={styles.passoTexto}>{p.texto}</Text>
          </View>
        ))}
      </Cartao>

      <Botao titulo="Também vejo isso aqui" onPress={confirmar} carregando={enviando} />
      <Botao titulo="Ver abrigo próximo" variante="secundario" onPress={() => nav.navigate('Tabs', { screen: 'Abrigos' })} estilo={{ marginTop: espaco.sm }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  foto: { height: 160, borderRadius: 12, backgroundColor: cores.primariaClara, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: espaco.md },
  imagem: { width: '100%', height: '100%' },
  titulo: { fontSize: fonte.titulo, fontWeight: '700', color: cores.texto },
  sub: { fontSize: fonte.pequena, color: cores.textoSecundario, marginTop: 2 },
  descricao: { fontSize: fonte.normal, color: cores.texto },
  passo: { flexDirection: 'row', alignItems: 'center', paddingVertical: espaco.xs },
  passoTexto: { marginLeft: espaco.sm, fontSize: fonte.normal, color: cores.texto },
});
