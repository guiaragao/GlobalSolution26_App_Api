// Contexto de autenticação: guarda o usuário logado e expõe entrar/cadastrar/sair.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DadosCadastro, Usuario } from '../modelos';
import * as api from '../servicos/api';

interface AuthValor {
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const entrar = useCallback(async (email: string, senha: string) => {
    const r = await api.login(email, senha);
    api.definirToken(r.token);
    setUsuario(r.usuario);
  }, []);

  const cadastrar = useCallback(async (dados: DadosCadastro) => {
    const r = await api.cadastrar(dados);
    api.definirToken(r.token);
    setUsuario(r.usuario);
  }, []);

  const sair = useCallback(() => {
    api.definirToken(undefined);
    setUsuario(null);
  }, []);

  // useMemo evita re-renderizar todos os consumidores quando nada mudou.
  const valor = useMemo(() => ({ usuario, entrar, cadastrar, sair }), [usuario, entrar, cadastrar, sair]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
