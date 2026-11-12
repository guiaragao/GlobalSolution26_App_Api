// Tela de cadastro.

import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Botao from '../componentes/Botao';
import Campo from '../componentes/Campo';
import Chip from '../componentes/Chip';
import { useAuth } from '../contexto/AuthContext';
import { Usuario } from '../modelos';
import { cores, espaco, fonte } from '../tema';

const PERFIS: { valor: Usuario['perfil']; rotulo: string }[] = [
  { valor: 'morador', rotulo: 'Morador' },
  { valor: 'idoso', rotulo: 'Idoso' },
  { valor: 'voluntario', rotulo: 'Voluntário' },
];

export default function Cadastro() {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [bairro, setBairro] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<Usuario['perfil']>('morador');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    const e: Record<string, string> = {};
    if (nome.trim().length < 3) e.nome = 'Digite seu nome completo.';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Digite um e-mail válido.';
    if (!bairro.trim()) e.bairro = 'Informe seu bairro.';
    if (senha.length < 6) e.senha = 'A senha precisa ter ao menos 6 caracteres.';
    setErros(e);
    if (Object.keys(e).length) return;

    setCarregando(true);
    try {
      await cadastrar({ nome: nome.trim(), email: email.trim(), bairro: bairro.trim(), senha, perfil });
    } catch {
      Alert.alert('Não foi possível criar a conta', 'Tente de novo em instantes.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Criar conta</Text>
        <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} erro={erros.nome} />
        <Campo rotulo="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" erro={erros.email} />
        <Campo rotulo="Bairro" value={bairro} onChangeText={setBairro} erro={erros.bairro} />
        <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry erro={erros.senha} />
        <Text style={styles.rotulo}>Perfil</Text>
        <View style={styles.linha}>
          {PERFIS.map((p) => (
            <Chip key={p.valor} rotulo={p.rotulo} ativo={perfil === p.valor} onPress={() => setPerfil(p.valor)} />
          ))}
        </View>
        <Botao titulo="Cadastrar" onPress={enviar} carregando={carregando} estilo={{ marginTop: espaco.md }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.xl },
  titulo: { fontSize: fonte.grande, fontWeight: '700', color: cores.texto, marginBottom: espaco.lg },
  rotulo: { fontSize: fonte.pequena, color: cores.textoSecundario, marginBottom: espaco.xs },
  linha: { flexDirection: 'row', flexWrap: 'wrap' },
});
