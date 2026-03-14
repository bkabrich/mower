import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { RootStackParamList } from './src/types/navigation'
import { HomeScreen } from './src/screens/HomeScreen'
import { MapControlScreen } from './src/screens/MapControlScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#1e293b' },
            headerTintColor: '#f1f5f9',
            headerTitleStyle: { fontWeight: '600', fontSize: 18 },
            contentStyle: { backgroundColor: '#0f172a' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Mower App' }}
          />
          <Stack.Screen
            name="MapControl"
            component={MapControlScreen}
            options={{ title: 'Map & Mowing' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  )
}
