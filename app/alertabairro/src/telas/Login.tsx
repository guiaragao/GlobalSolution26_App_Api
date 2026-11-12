// Tela de login.

import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Botao from '../componentes/Botao';
import Campo from '../componentes/Campo';
import { useAuth } from '../contexto/AuthContext';
import { cores, espaco, fonte } from '../tema';

export default function Login() {
  const nav = useNavigation<any>();
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    const e: typeof erros = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Digite um e-mail válido.';
    if (senha.length < 4) e.senha = 'A senha precisa ter ao menos 4 caracteres.';
    setErros(e);
    if (Object.keys(e).length) return;

    setCarregando(true);
    try {
      await entrar(email.trim(), senha);
      // A navegação para o app acontece sozinha quando "usuario" é definido.
    } catch {
      Alert.alert('Não foi possível entrar', 'Confira seus dados e tente de novo.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Entrar</Text>
        <Campo rotulo="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="name@email.com" erro={erros.email} />
        <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry placeholder="Sua senha" erro={erros.senha} />
        <Botao titulo="Entrar" onPress={enviar} carregando={carregando} />
        <Text style={styles.rodape} onPress={() => nav.navigate('Cadastro')}>
          Não tem conta? <Text style={styles.link}>Criar conta</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.xl },
  titulo: { fontSize: fonte.grande, fontWeight: '700', color: cores.texto, marginBottom: espaco.lg },
  rodape: { textAlign: 'center', marginTop: espaco.lg, color: cores.textoSecundario, fontSize: fonte.normal },
  link: { color: cores.primaria, fontWeight: '600' },
});
