// Funcionalidade 2: abrigos, abrigo mais próximo, rota no mapa e botão SOS.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import BotaoSOS from '../componentes/BotaoSOS';
import Botao from '../componentes/Botao';
import Cartao from '../componentes/Cartao';
import Etiqueta from '../componentes/Etiqueta';
import { Abrigo } from '../modelos';
import { abrigoMaisProximo, listarAbrigos } from '../servicos/api';
import { obterLocalizacao } from '../servicos/localizacao';
import { cores, espaco, fonte } from '../tema';
import { COORDENADA_PADRAO, Coordenada, distanciaKm, formatarDistancia } from '../utils/geo';

const ItemAbrigo = React.memo(function ItemAbrigo({ a, pos }: { a: Abrigo; pos: Coordenada }) {
  const vagas = a.capacidade - a.vagasOcupadas;
  return (
    <Cartao>
      <Text style={styles.itemTitulo}>{a.nome}</Text>
      <Text style={styles.sub}>{a.endereco}</Text>
      <Text style={styles.sub}>{formatarDistancia(distanciaKm(pos, a))}</Text>
      <View style={{ marginTop: espaco.xs }}>
        {vagas > 0 ? <Etiqueta texto={`${vagas} vagas`} tom="sucesso" /> : <Etiqueta texto="Lotado" tom="perigo" />}
      </View>
    </Cartao>
  );
});

export default function Abrigos() {
  const [lista, setLista] = useState<Abrigo[]>([]);
  const [pos, setPos] = useState<Coordenada>(COORDENADA_PADRAO);
  const [destino, setDestino] = useState<Abrigo | null>(null);
  const [rota, setRota] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const mapa = useRef<MapView>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const [abrigos, p] = await Promise.all([listarAbrigos(), obterLocalizacao()]);
      if (!ativo) return;
      setLista(abrigos);
      setPos(p);
      setDestino(await abrigoMaisProximo(p));
      setCarregando(false);
    })().catch(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  const tracarRota = useCallback(() => {
    if (!destino) {
      Alert.alert('Sem vagas', 'Nenhum abrigo com vagas foi encontrado agora.');
      return;
    }
    setRota(true);
    mapa.current?.fitToCoordinates([pos, destino], { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true });
  }, [destino, pos]);

  return (
    <View style={styles.tela}>
      <MapView ref={mapa} style={styles.mapa} initialRegion={{ ...pos, latitudeDelta: 0.03, longitudeDelta: 0.03 }} showsUserLocation>
        {lista.map((a) => (
          <Marker key={a.id} coordinate={{ latitude: a.latitude, longitude: a.longitude }} title={a.nome} pinColor={cores.primaria} />
        ))}
        {rota && destino && <Polyline coordinates={[pos, destino]} strokeColor={cores.primaria} strokeWidth={4} />}
      </MapView>

      {carregando ? (
        <ActivityIndicator style={{ margin: espaco.lg }} color={cores.primaria} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => <ItemAbrigo a={item} pos={pos} />}
          contentContainerStyle={{ padding: espaco.md, paddingBottom: 90 }}
          ListHeaderComponent={
            <Cartao estilo={{ backgroundColor: cores.primariaClara, borderColor: cores.primaria }}>
              <Text style={styles.itemTitulo}>Abrigo mais próximo</Text>
              <Text style={styles.sub}>
                {destino ? `${destino.nome} · ${formatarDistancia(distanciaKm(pos, destino))}` : 'Nenhum abrigo com vagas no momento'}
              </Text>
              <Botao titulo="Traçar rota" icone="navigate" onPress={tracarRota} estilo={{ marginTop: espaco.sm }} />
            </Cartao>
          }
        />
      )}
      <BotaoSOS />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  mapa: { height: 220 },
  itemTitulo: { fontSize: fonte.normal, fontWeight: '600', color: cores.texto },
  sub: { fontSize: fonte.pequena, color: cores.textoSecundario, marginTop: 2 },
});
