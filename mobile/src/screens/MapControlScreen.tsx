import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Animated,
} from 'react-native'
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps'
import { useMowerStore, PROPERTY_BOUNDARY, NO_GO_ZONES } from '../store/mowerStore'
import { BatteryIndicator } from '../components/BatteryIndicator'
import {
  positionAlongPath,
  pathLengthMeters,
  haversineMeters,
} from '../lib/geoUtils'
import type { PathPoint } from '../types/mower'

/** Fallback map center (centroid of property boundary). */
const DEFAULT_LAT = 39.32
const DEFAULT_LNG = -75.926
const DELTA = 0.01

const PRIMARY_GREEN = '#22c55e'
const DISABLED_GRAY = '#64748b'
const RECORDING_RED = '#ef4444'
const PATH_BLUE = '#3b82f6'
const COVERED_GREEN = 'rgba(34, 197, 94, 0.9)'

/** Small test path inside boundary for "Simulate Drive" (demo). */
const SIMULATE_PATH: PathPoint[] = (() => {
  const c = { lat: DEFAULT_LAT, lng: DEFAULT_LNG }
  const d = 0.0012
  return [
    { lat: c.lat - d, lng: c.lng - d },
    { lat: c.lat - d, lng: c.lng + d },
    { lat: c.lat + d, lng: c.lng + d },
    { lat: c.lat + d, lng: c.lng - d },
    { lat: c.lat - d, lng: c.lng - d },
  ]
})()

export function MapControlScreen() {
  const {
    isConnected,
    batteryPercent,
    lastKnownPosition,
    mowingStatus,
    progressPercent,
    currentPath,
    mowingPosition,
    toastMessage,
    isRecording,
    recordedPath,
    startRecording,
    stopRecording,
    addPositionToPath,
    clearRecordedPath,
    setLastKnownPosition,
    startMowing,
    stopMowing,
    pauseMowing,
  } = useMowerStore()

  const [showConfirm, setShowConfirm] = useState(false)
  const [simulateDrive, setSimulateDrive] = useState(false)
  const simulateIndexRef = useRef(0)
  const pulseAnim = useState(() => new Animated.Value(1))[0]
  const recordPulseAnim = useState(() => new Animated.Value(1))[0]

  const canStartMowing =
    isConnected &&
    batteryPercent >= 20 &&
    recordedPath.length >= 2 &&
    mowingStatus !== 'mowing'
  const isMowing = mowingStatus === 'mowing'
  const showMovingMarker = isMowing && progressPercent > 0

  // Pulsing green dot when mowing
  useEffect(() => {
    if (!showMovingMarker) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [showMovingMarker, pulseAnim])

  // Pulsing red dot when recording
  useEffect(() => {
    if (!isRecording) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(recordPulseAnim, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordPulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [isRecording, recordPulseAnim])

  // When position updates and we're recording, add to path (store applies min-distance filter)
  useEffect(() => {
    if (isRecording && lastKnownPosition) {
      addPositionToPath(lastKnownPosition)
    }
  }, [isRecording, lastKnownPosition?.latitude, lastKnownPosition?.longitude, addPositionToPath])

  // Simulate Drive: fake position updates along test path (demo only)
  useEffect(() => {
    if (!simulateDrive || !isRecording) return
    const interval = setInterval(() => {
      const idx = simulateIndexRef.current % SIMULATE_PATH.length
      const p = SIMULATE_PATH[idx]
      setLastKnownPosition({ latitude: p.lat, longitude: p.lng })
      simulateIndexRef.current = idx + 1
    }, 1200)
    return () => clearInterval(interval)
  }, [simulateDrive, isRecording, setLastKnownPosition])

  const markerPosition = isMowing && mowingPosition ? mowingPosition : lastKnownPosition

  const region = {
    latitude: markerPosition?.latitude ?? DEFAULT_LAT,
    longitude: markerPosition?.longitude ?? DEFAULT_LNG,
    latitudeDelta: DELTA,
    longitudeDelta: DELTA,
  }

  const boundaryCoords = PROPERTY_BOUNDARY.map((p) => ({
    latitude: p.lat,
    longitude: p.lng,
  }))

  const noGoCoords = NO_GO_ZONES.map((zone) =>
    zone.map((p) => ({ latitude: p.lat, longitude: p.lng }))
  )

  // Recorded path: blue polyline (dashed while recording, solid when stopped)
  const recordedPathCoords = recordedPath.map((p) => ({
    latitude: p.lat,
    longitude: p.lng,
  }))

  // When mowing: full path in blue; covered portion in green
  const totalPathLen = currentPath.length >= 2 ? pathLengthMeters(currentPath) : 0
  const coveredLen = totalPathLen > 0 ? (progressPercent / 100) * totalPathLen : 0
  const currentPathCoords = currentPath.map((p) => ({
    latitude: p.lat,
    longitude: p.lng,
  }))
  const coveredPathCoords: { latitude: number; longitude: number }[] = []
  if (currentPath.length >= 2 && coveredLen > 0) {
    let d = 0
    coveredPathCoords.push({
      latitude: currentPath[0].lat,
      longitude: currentPath[0].lng,
    })
    for (let i = 1; i < currentPath.length; i++) {
      const segLen = haversineMeters(
        currentPath[i - 1].lat,
        currentPath[i - 1].lng,
        currentPath[i].lat,
        currentPath[i].lng
      )
      if (d + segLen >= coveredLen) {
        const pos = positionAlongPath(currentPath, coveredLen)
        if (pos)
          coveredPathCoords.push({
            latitude: pos.lat,
            longitude: pos.lng,
          })
        break
      }
      d += segLen
      coveredPathCoords.push({
        latitude: currentPath[i].lat,
        longitude: currentPath[i].lng,
      })
    }
  }

  const handleStartMowingPress = () => setShowConfirm(true)
  const handleConfirmStart = () => {
    setShowConfirm(false)
    startMowing()
  }

  const handleClearPath = () => {
    if (recordedPath.length === 0) return
    clearRecordedPath()
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Mowing map & control</Text>

        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            initialRegion={region}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            <Polygon
              coordinates={boundaryCoords}
              fillColor="rgba(34, 197, 94, 0.12)"
              strokeColor={PRIMARY_GREEN}
              strokeWidth={2}
            />
            {noGoCoords.map((coords, i) => (
              <Polygon
                key={i}
                coordinates={coords}
                fillColor="rgba(239, 68, 68, 0.25)"
                strokeColor="#ef4444"
                strokeWidth={2}
              />
            ))}
            {/* Recorded path: blue, dashed when recording */}
            {recordedPathCoords.length > 1 && !isMowing && (
              <Polyline
                coordinates={recordedPathCoords}
                strokeColor={PATH_BLUE}
                strokeWidth={3}
                lineDashPhase={isRecording ? 10 : 0}
                lineDashPattern={isRecording ? [8, 4] : undefined}
              />
            )}
            {/* When mowing: covered portion in green, rest in blue */}
            {isMowing && currentPathCoords.length > 1 && (
              <>
                <Polyline
                  coordinates={currentPathCoords}
                  strokeColor={PATH_BLUE}
                  strokeWidth={2}
                />
                {coveredPathCoords.length > 1 && progressPercent > 0 && (
                  <Polyline
                    coordinates={coveredPathCoords}
                    strokeColor={COVERED_GREEN}
                    strokeWidth={4}
                  />
                )}
              </>
            )}
            {markerPosition && (
              <Marker
                coordinate={{
                  latitude: markerPosition.latitude,
                  longitude: markerPosition.longitude,
                }}
                title="Mower"
                description={showMovingMarker ? 'Mowing' : isRecording ? 'Recording' : 'Current position'}
              >
                {showMovingMarker ? (
                  <Animated.View
                    style={[
                      styles.markerPulseWrap,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <View style={styles.markerPulseDot} />
                  </Animated.View>
                ) : (
                  <View style={styles.markerWrap}>
                    <Text style={styles.markerEmoji}>🚜</Text>
                  </View>
                )}
              </Marker>
            )}
          </MapView>

          <View style={styles.floatingBattery} pointerEvents="box-none">
            <BatteryIndicator percent={batteryPercent} connected={isConnected} />
          </View>

          {!isConnected && (
            <View style={styles.disconnectedOverlay} pointerEvents="none">
              <View style={styles.disconnectedMessage}>
                <Text style={styles.disconnectedText}>
                  Mower not connected – connect first
                </Text>
              </View>
            </View>
          )}

          {/* Recording indicator overlay */}
          {isRecording && (
            <View style={styles.recordingOverlay} pointerEvents="none">
              <Animated.View
                style={[
                  styles.recordingDotWrap,
                  { transform: [{ scale: recordPulseAnim }] },
                ]}
              >
                <View style={styles.recordingDot} />
              </Animated.View>
              <Text style={styles.recordingText}>
                Recording path – drive the mower
              </Text>
            </View>
          )}
        </View>

        {/* Record path section */}
        <Text style={styles.label}>Record path</Text>
        <View style={styles.recordRow}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.recordButtonText,
                isRecording && styles.recordButtonTextActive,
              ]}
            >
              {isRecording ? 'Stop recording' : 'Start recording path'}
            </Text>
          </TouchableOpacity>
          {isRecording && (
            <TouchableOpacity
              style={styles.stopRecordButton}
              onPress={stopRecording}
              activeOpacity={0.85}
            >
              <Text style={styles.stopRecordButtonText}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
        {recordedPath.length > 0 && !isRecording && (
          <TouchableOpacity
            style={styles.clearPathButton}
            onPress={handleClearPath}
            activeOpacity={0.85}
          >
            <Text style={styles.clearPathButtonText}>Clear path</Text>
          </TouchableOpacity>
        )}

        {/* Simulate Drive (demo) */}
        <View style={styles.simulateRow}>
          <Text style={styles.simulateLabel}>Demo:</Text>
          <TouchableOpacity
            style={[
              styles.simulateButton,
              simulateDrive && isRecording && styles.simulateButtonActive,
            ]}
            onPress={() => setSimulateDrive((s) => !s)}
            disabled={!isRecording}
            activeOpacity={0.85}
          >
            <Text style={styles.simulateButtonText}>
              {simulateDrive && isRecording ? 'Simulating…' : 'Simulate drive'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress when mowing or paused */}
        {(isMowing || mowingStatus === 'paused') && (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.progressCircleWrap}>
                <Text style={styles.progressPercent}>
                  {Math.round(progressPercent)}%
                </Text>
              </View>
              <View style={styles.progressTextWrap}>
                <Text style={styles.progressTitle}>
                  {mowingStatus === 'paused' ? 'Paused' : 'Mowing in progress'}
                </Text>
                <Text style={styles.progressSub}>Recorded path</Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Start / Stop mowing */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.startButton,
              !canStartMowing && styles.startButtonDisabled,
            ]}
            onPress={handleStartMowingPress}
            disabled={!canStartMowing}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.startButtonText,
                !canStartMowing && styles.startButtonTextDisabled,
              ]}
            >
              Start mowing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={isMowing ? pauseMowing : stopMowing}
            disabled={
              !isConnected ||
              (mowingStatus !== 'mowing' && mowingStatus !== 'paused')
            }
            activeOpacity={0.85}
          >
            <Text style={styles.stopButtonText}>
              {isMowing ? 'Pause' : 'Stop'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirm(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowConfirm(false)}
          >
            <Pressable
              style={styles.modalBox}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Start mowing?</Text>
              <Text style={styles.modalMessage}>
                Mow along the recorded path ({recordedPath.length} points)?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowConfirm(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirm}
                  onPress={handleConfirmStart}
                >
                  <Text style={styles.modalConfirmText}>Start</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>

      {toastMessage ? (
        <View style={styles.toastWrap}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#94a3b8',
    marginBottom: 12,
  },
  mapWrapper: {
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#475569',
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerEmoji: {
    fontSize: 28,
  },
  markerPulseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulseDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PRIMARY_GREEN,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingBattery: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  disconnectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  disconnectedMessage: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  disconnectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  recordingOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RECORDING_RED,
    zIndex: 6,
  },
  recordingDotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: RECORDING_RED,
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fca5a5',
  },
  toastWrap: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 20,
  },
  toast: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    maxWidth: '100%',
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 8,
  },
  recordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  recordButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: PRIMARY_GREEN,
    minWidth: 160,
  },
  recordButtonActive: {
    backgroundColor: RECORDING_RED,
  },
  recordButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  recordButtonTextActive: {
    color: '#fff',
  },
  stopRecordButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: RECORDING_RED,
  },
  stopRecordButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fca5a5',
  },
  clearPathButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: '#334155',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  clearPathButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  simulateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  simulateLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  simulateButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#1e293b',
  },
  simulateButtonActive: {
    borderColor: RECORDING_RED,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  simulateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  progressCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    padding: 16,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressCircleWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#475569',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 3,
  },
  progressTextWrap: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  progressSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  startButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: PRIMARY_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  startButtonDisabled: {
    backgroundColor: '#334155',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  startButtonTextDisabled: {
    color: DISABLED_GRAY,
  },
  stopButton: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#475569',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e2e8f0',
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: PRIMARY_GREEN,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
})
