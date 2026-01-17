import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, X, RotateCcw, Check, Wand2 } from 'lucide-react-native';
import { colors, spacing, radii } from '../../theme/tokens';
import FreshieEditor from './FreshieEditor';

interface FreshieCameraProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (photoUri: string) => void;
}

/**
 * Freshie Camera Component
 * A selfie-style camera for kids to capture their skincare routine moments
 */
export default function FreshieCamera({ visible, onClose, onCapture }: FreshieCameraProps) {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Camera size={64} color={colors.purple} />
          <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to take Freshies!
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const retakePicture = () => {
    setCapturedPhoto(null);
  };

  const confirmPicture = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      setCapturedPhoto(null);
      onClose();
    }
  };

  const openEditor = () => {
    if (capturedPhoto) {
      setShowEditor(true);
    }
  };

  const handleEditorSave = (editedUri: string) => {
    setShowEditor(false);
    onCapture(editedUri);
    setCapturedPhoto(null);
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {capturedPhoto ? (
          // Preview captured photo
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedPhoto }} style={styles.preview} />
            
            {/* Preview Controls */}
            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
                <RotateCcw size={24} color={colors.white} />
                <Text style={styles.controlText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.editButton} onPress={openEditor}>
                <Wand2 size={24} color={colors.white} />
                <Text style={styles.controlText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={confirmPicture}>
                <Check size={32} color={colors.white} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Camera view
          <>
            <CameraView 
              ref={cameraRef}
              style={styles.camera} 
              facing={facing}
            >
              {/* Close Button */}
              <View style={styles.topControls}>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => {
                    console.log('Close button pressed');
                    onClose();
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <X size={28} color={colors.white} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Freshie Frame Overlay */}
              <View style={styles.frameOverlay}>
                <View style={styles.frameCircle} />
                <Text style={styles.frameText}>Take a Freshie! ✨</Text>
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <TouchableOpacity 
                  style={styles.flipButton} 
                  onPress={toggleCameraFacing}
                >
                  <RotateCcw size={28} color={colors.white} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <View style={styles.flipButton} />
              </View>
            </CameraView>
          </>
        )}
      </View>

      {/* Editor Modal */}
      {capturedPhoto && (
        <FreshieEditor
          visible={showEditor}
          photoUri={capturedPhoto}
          onClose={() => setShowEditor(false)}
          onSave={handleEditorSave}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.white,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  permissionText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 24,
    opacity: 0.7,
  },
  permissionButton: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radii.pill,
    marginBottom: spacing[3],
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  cancelButton: {
    paddingVertical: spacing[3],
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.charcoal,
    opacity: 0.6,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[4],
    zIndex: 100,
    elevation: 100,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
    elevation: 101,
  },
  frameOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameCircle: {
    width: 260,
    height: 340,
    borderRadius: 170,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
  },
  frameText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing[4],
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.white,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radii.pill,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.purple,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radii.pill,
  },
  controlText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  confirmButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
