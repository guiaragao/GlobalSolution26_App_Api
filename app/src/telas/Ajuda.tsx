// Funcionalidade 3: rede de ajuda (pedidos e ofertas) e check-in "estou bem".

import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Botao from '../componentes/Botao';
import BotaoSOS from '../componentes/BotaoSOS';
import Cartao from '../componentes/Cartao';
import Chip from '../componentes/Chip';
import Etiqueta from '../componentes/Etiqueta';
import { ModoAjuda, PedidoAjuda } from '../modelos';
import { enviarCheckin, listarPedidos } from '../servicos/api';
import { obterLocalizacao } from '../servicos/localizacao';
import { cores, espaco, fonte } from '../tema';

const ItemPedido = React.memo(function ItemPedido({ p }: { p: PedidoAjuda }) {
  return (
    <Cartao>
      <Text style={styles.itemTitulo}>{p.categoria}</Text>
      <Text style={styles.descricao}>{p.descricao}</Text>
      <Text style={styles.sub}>{p.distancia} de você</Text>
      <View style={{ marginTop: espaco.xs }}>
        <Etiqueta texto={p.status === 'atendido' ? 'Atendido' : 'Aguardando'} tom={p.status === 'atendido' ? 'sucesso' : 'atencao'} />
      </View>
    </Cartao>
  );
});

export default function Ajuda() {
  const nav = useNavigation<any>();
  const [lista, setLista] = useState<PedidoAjuda[]>([]);
  const [modo, setModo] = useState<ModoAjuda>('pedido');
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      listarPedidos()
        .then((r) => ativo && setLista(r))
        .finally(() => ativo && setCarregando(false));
      return () => {
        ativo = false;
      };
    }, []),
  );

  const filtrados = useMemo(() => lista.filter((p) => p.modo === modo), [lista, modo]);

  const estouBem = useCallback(async () => {
    try {
      const pos = await obterLocalizacao();
      await enviarCheckin('estou_bem', pos);
      Alert.alert('Check-in enviado', 'Sua família e seus vizinhos sabem que você está bem.');
    } catch {
      Alert.alert('Não foi possível enviar', 'Tente de novo.');
    }
  }, []);

  return (
    <View style={styles.tela}>
      <FlatList
        data={filtrados}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => <ItemPedido p={item} />}
        contentContainerStyle={{ padding: espaco.md, paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <Botao titulo="Estou bem" variante="sucesso" icone="checkmark-circle" onPress={estouBem} />
            <View style={styles.filtros}>
              <Chip rotulo="Pedidos" ativo={modo === 'pedido'} onPress={() => setModo('pedido')} />
              <Chip rotulo="Ofertas" ativo={modo === 'oferta'} onPress={() => setModo('oferta')} />
            </View>
            {carregando && <ActivityIndicator color={cores.primaria} />}
          </View>
        }
        ListEmptyComponent={!carregando ? <Text style={styles.vazio}>Nada por aqui ainda.</Text> : null}
      />
      <View style={styles.novo}>
        <Botao titulo="Novo pedido de ajuda" variante="secundario" onPress={() => nav.navigate('NovoPedido')} />
      </View>
      <BotaoSOS />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  filtros: { flexDirection: 'row', marginTop: espaco.md },
  itemTitulo: { fontSize: fonte.normal, fontWeight: '600', color: cores.texto },
  descricao: { fontSize: fonte.pequena + 1, color: cores.texto, marginTop: 2 },
  sub: { fontSize: fonte.pequena, color: cores.textoSecundario, marginTop: 2 },
  vazio: { textAlign: 'center', color: cores.textoSecundario, marginTop: espaco.lg },
  novo: { position: 'absolute', left: espaco.md, right: 96, bottom: espaco.md },
});
