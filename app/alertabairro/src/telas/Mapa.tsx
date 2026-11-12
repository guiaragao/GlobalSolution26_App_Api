// Funcionalidade 1: mapa de ocorrências com filtro por status e lista abaixo.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Botao from '../componentes/Botao';
import Cartao from '../componentes/Cartao';
import Chip from '../componentes/Chip';
import Etiqueta, { TomEtiqueta } from '../componentes/Etiqueta';
import { Ocorrencia } from '../modelos';
import { listarOcorrencias } from '../servicos/api';
import { obterLocalizacao } from '../servicos/localizacao';
import { cores, espaco, fonte } from '../tema';
import { COORDENADA_PADRAO, tempoDecorrido } from '../utils/geo';

type Filtro = 'todas' | 'abertas' | 'resolvidas';

const corPino = (o: Ocorrencia) =>
  o.status === 'resolvida' ? cores.sucesso : o.prioridade === 'critica' ? cores.perigo : cores.atencao;

const rotuloStatus = { aberta: 'Aberta', em_atendimento: 'Em atendimento', resolvida: 'Resolvida' };
const tomStatus: Record<Ocorrencia['status'], TomEtiqueta> = { aberta: 'perigo', em_atendimento: 'atencao', resolvida: 'sucesso' };

// Item da lista isolado e memorizado: evita re-renderizar linhas que não mudaram.
const ItemOcorrencia = React.memo(function ItemOcorrencia({ o, abrir }: { o: Ocorrencia; abrir: (id: number) => void }) {
  return (
    <Cartao onPress={() => abrir(o.id)}>
      <Text style={styles.itemTitulo}>{o.tipo} · {o.bairro}</Text>
      <Text style={styles.sub}>{tempoDecorrido(o.criadaEm)} · {o.relatos} {o.relatos === 1 ? 'relato' : 'relatos'}</Text>
      <View style={{ marginTop: espaco.xs }}>
        <Etiqueta texto={rotuloStatus[o.status]} tom={tomStatus[o.status]} />
      </View>
    </Cartao>
  );
});

export default function Mapa() {
  const nav = useNavigation<any>();
  const [lista, setLista] = useState<Ocorrencia[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [carregando, setCarregando] = useState(true);

  // Pede a permissão de GPS ao abrir o mapa, para o ponto azul "você está aqui" aparecer.
  useEffect(() => {
    obterLocalizacao();
  }, []);

  // Recarrega ao voltar para a tela (ex.: depois de registrar uma ocorrência).
  useFocusEffect(
    useCallback(() => {
      let ativo = true; // evita atualizar estado depois que a tela saiu
      setCarregando(true);
      listarOcorrencias()
        .then((r) => ativo && setLista(r))
        .finally(() => ativo && setCarregando(false));
      return () => {
        ativo = false;
      };
    }, []),
  );

  const filtradas = useMemo(() => {
    if (filtro === 'abertas') return lista.filter((o) => o.status !== 'resolvida');
    if (filtro === 'resolvidas') return lista.filter((o) => o.status === 'resolvida');
    return lista;
  }, [lista, filtro]);

  const abrir = useCallback((id: number) => nav.navigate('Detalhe', { id }), [nav]);

  return (
    <View style={styles.tela}>
      <View style={styles.filtros}>
        <Chip rotulo="Todas" ativo={filtro === 'todas'} onPress={() => setFiltro('todas')} />
        <Chip rotulo="Abertas" ativo={filtro === 'abertas'} onPress={() => setFiltro('abertas')} />
        <Chip rotulo="Resolvidas" ativo={filtro === 'resolvidas'} onPress={() => setFiltro('resolvidas')} />
      </View>

      <MapView
        style={styles.mapa}
        initialRegion={{ ...COORDENADA_PADRAO, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        showsUserLocation
      >
        {filtradas.map((o) => (
          <Marker
            key={o.id}
            coordinate={{ latitude: o.latitude, longitude: o.longitude }}
            title={o.tipo}
            description={rotuloStatus[o.status]}
            pinColor={corPino(o)}
            onCalloutPress={() => abrir(o.id)}
          />
        ))}
      </MapView>

      {carregando ? (
        <ActivityIndicator style={{ margin: espaco.lg }} color={cores.primaria} />
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(o) => String(o.id)}
          renderItem={({ item }) => <ItemOcorrencia o={item} abrir={abrir} />}
          contentContainerStyle={styles.lista}
          initialNumToRender={6}
          windowSize={5}
          removeClippedSubviews
          ListEmptyComponent={<Text style={styles.vazio}>Nenhuma ocorrência neste filtro.</Text>}
        />
      )}

      <View style={styles.rodape}>
        <Botao titulo="Registrar ocorrência" icone="add" onPress={() => nav.navigate('NovaOcorrencia')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  filtros: { flexDirection: 'row', padding: espaco.md, paddingBottom: 0 },
  mapa: { height: 220 },
  lista: { padding: espaco.md, paddingBottom: 90 },
  itemTitulo: { fontSize: fonte.normal, fontWeight: '600', color: cores.texto },
  sub: { fontSize: fonte.pequena, color: cores.textoSecundario, marginTop: 2 },
  vazio: { textAlign: 'center', color: cores.textoSecundario, marginTop: espaco.xl },
  rodape: { position: 'absolute', left: espaco.md, right: espaco.md, bottom: espaco.md },
});
