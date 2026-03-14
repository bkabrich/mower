import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types/navigation'
import { useMowerStore } from '../store/mowerStore'

type HomeScreenNav = NativeStackNavigationProp<RootStackParamList, 'Home'>

export function HomeScreen({ navigation }: { navigation: HomeScreenNav }) {
  const { isConnected, batteryPercent, lastKnownPosition, setConnected } = useMowerStore()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mower App</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View
            style={[styles.dot, isConnected ? styles.dotConnected : styles.dotDisconnected]}
          />
          <Text style={styles.label}>Connection</Text>
          <Text style={styles.value}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Battery</Text>
          <Text style={styles.value}>{Math.round(batteryPercent)}%</Text>
        </View>
        {lastKnownPosition && (
          <View style={styles.row}>
            <Text style={styles.label}>Position</Text>
            <Text style={styles.valueSmall}>
              {lastKnownPosition.latitude.toFixed(5)}, {lastKnownPosition.longitude.toFixed(5)}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.button, isConnected ? styles.buttonDisconnect : styles.buttonConnect]}
        onPress={() => setConnected(!isConnected)}
      >
        <Text style={styles.buttonText}>
          {isConnected ? 'Disconnect' : 'Connect'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => navigation.navigate('MapControl')}
      >
        <Text style={styles.mapButtonText}>Map & mowing control →</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotConnected: {
    backgroundColor: '#22c55e',
  },
  dotDisconnected: {
    backgroundColor: '#ef4444',
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    minWidth: 80,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  valueSmall: {
    fontSize: 12,
    color: '#cbd5e1',
    flex: 1,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonConnect: {
    backgroundColor: '#22c55e',
  },
  buttonDisconnect: {
    backgroundColor: '#f59e0b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  mapButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
})
