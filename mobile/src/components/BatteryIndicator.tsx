import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface BatteryIndicatorProps {
  percent: number
  connected: boolean
}

export function BatteryIndicator({ percent, connected }: BatteryIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const isLow = clamped < 20
  const fillWidth = `${clamped}%`
  const barColor = isLow ? '#ef4444' : '#22c55e'

  return (
    <View style={styles.wrap}>
      <View style={[styles.dot, connected ? styles.dotOn : styles.dotOff]} />
      <View style={styles.batteryBar}>
        <View style={[styles.batteryFill, { width: fillWidth, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.percent}>{Math.round(clamped)}%</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: '#22c55e',
  },
  dotOff: {
    backgroundColor: '#64748b',
  },
  batteryBar: {
    width: 28,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#64748b',
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 1,
  },
  percent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
})
