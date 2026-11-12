// Perfil do usuário, preferências e opção de sair da conta.

import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Botao from '../componentes/Botao';
import Cartao from '../componentes/Cartao';
import { useAuth } from '../contexto/AuthContext';
import { cores, espaco, fonte } from '../tema';

const rotuloPerfil = { morador: 'Morador(a)', idoso: 'Idoso(a)', voluntario: 'Voluntário(a)' };

export default function Perfil() {
  const { usuario, sair } = useAuth();
  const [notificacoes, setNotificacoes] = useState(true);
  const [fonteGrande, setFonteGrande] = useState(false);
  const [altoContraste, setAltoContraste] = useState(false);

  function confirmarSaida() {
    Alert.alert('Sair da conta?', 'Você precisará entrar de novo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: sair }, // volta para a tela Início
    ]);
  }

  const iniciais = (usuario?.nome ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ScrollView style={styles.tela} contentContainerStyle={{ padding: espaco.lg }}>
      <View style={styles.topo}>
        <View style={styles.avatar}>
          <Text style={styles.iniciais}>{iniciais}</Text>
        </View>
        <View>
          <Text style={styles.nome}>{usuario?.nome}</Text>
          <Text style={styles.sub}>
            {usuario?.bairro} · {usuario ? rotuloPerfil[usuario.perfil] : ''}
          </Text>
          <Text style={styles.sub}>{usuario?.email}</Text>
        </View>
      </View>

      <Cartao>
        <Linha rotulo="Notificações de alerta" valor={notificacoes} aoMudar={setNotificacoes} />
        <Linha rotulo="Fonte grande" valor={fonteGrande} aoMudar={setFonteGrande} />
        <Linha rotulo="Alto contraste" valor={altoContraste} aoMudar={setAltoContraste} ultima />
      </Cartao>

      <Botao titulo="Sair da conta" variante="secundario" icone="log-out-outline" onPress={confirmarSaida} estilo={{ marginTop: espaco.lg }} />
    </ScrollView>
  );
}

function Linha({ rotulo, valor, aoMudar, ultima }: { rotulo: string; valor: boolean; aoMudar: (v: boolean) => void; ultima?: boolean }) {
  return (
    <View style={[styles.linha, !ultima && styles.divisor]}>
      <Text style={styles.linhaTexto}>{rotulo}</Text>
      <Switch value={valor} onValueChange={aoMudar} trackColor={{ true: cores.primaria }} accessibilityLabel={rotulo} />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { flexDirection: 'row', alignItems: 'center', marginBottom: espaco.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: cores.primariaClara, alignItems: 'center', justifyContent: 'center', marginRight: espaco.md },
  iniciais: { color: cores.primaria, fontWeight: '700', fontSize: fonte.titulo },
  nome: { fontSize: fonte.titulo, fontWeight: '700', color: cores.texto },
  sub: { fontSize: fonte.pequena, color: cores.textoSecundario, marginTop: 2 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: espaco.sm },
  divisor: { borderBottomWidth: 1, borderBottomColor: cores.borda },
  linhaTexto: { fontSize: fonte.normal, color: cores.texto },
});
