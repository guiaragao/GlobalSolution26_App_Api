// Navegação: telas de entrada (sem login) e telas do app (com login).

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexto/AuthContext';
import { cores } from '../tema';
import Abrigos from '../telas/Abrigos';
import Ajuda from '../telas/Ajuda';
import Cadastro from '../telas/Cadastro';
import Detalhe from '../telas/Detalhe';
import Inicio from '../telas/Inicio';
import Login from '../telas/Login';
import Mapa from '../telas/Mapa';
import NovaOcorrencia from '../telas/NovaOcorrencia';
import NovoPedido from '../telas/NovoPedido';
import Perfil from '../telas/Perfil';

const Pilha = createNativeStackNavigator();
const Abas = createBottomTabNavigator();

const icones: Record<string, keyof typeof Ionicons.glyphMap> = {
  Mapa: 'map-outline',
  Abrigos: 'home-outline',
  Ajuda: 'heart-outline',
  Perfil: 'person-outline',
};

function AbasPrincipais() {
  return (
    <Abas.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => <Ionicons name={icones[route.name]} size={size} color={color} />,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabelStyle: { fontSize: 12 },
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Abas.Screen name="Mapa" component={Mapa} options={{ title: 'Mapa de ocorrências' }} />
      <Abas.Screen name="Abrigos" component={Abrigos} options={{ title: 'Abrigos e rota' }} />
      <Abas.Screen name="Ajuda" component={Ajuda} options={{ title: 'Rede de ajuda' }} />
      <Abas.Screen name="Perfil" component={Perfil} />
    </Abas.Navigator>
  );
}

export default function Navegacao() {
  const { usuario } = useAuth();

  return (
    <NavigationContainer>
      {usuario ? (
        <Pilha.Navigator>
          <Pilha.Screen name="Tabs" component={AbasPrincipais} options={{ headerShown: false }} />
          <Pilha.Screen name="Detalhe" component={Detalhe} options={{ title: 'Detalhe da ocorrência' }} />
          <Pilha.Screen name="NovaOcorrencia" component={NovaOcorrencia} options={{ title: 'Nova ocorrência' }} />
          <Pilha.Screen name="NovoPedido" component={NovoPedido} options={{ title: 'Novo pedido de ajuda' }} />
        </Pilha.Navigator>
      ) : (
        <Pilha.Navigator>
          <Pilha.Screen name="Inicio" component={Inicio} options={{ headerShown: false }} />
          <Pilha.Screen name="Login" component={Login} options={{ title: '' }} />
          <Pilha.Screen name="Cadastro" component={Cadastro} options={{ title: '' }} />
        </Pilha.Navigator>
      )}
    </NavigationContainer>
  );
}
