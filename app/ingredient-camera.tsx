import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { X, Camera, FileText } from 'lucide-react-native';
import { colors, spacing, radii } from '../src/theme/tokens';
import { extractTextFromImage, createSearchQueryFromIngredients, extractProductName } from '../src/services/ocr/ingredientScanner';
import { searchProducts } from '../src/services/api';

const { width, height } = Dimensions.get('window');

export default function IngredientCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fade out instructions after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleTakePhoto = async () => {
    if (!cameraRef) return;

    setLoading(true);

    try {
      // Take photo
      const photo = await (cameraRef as any).takePictureAsync({
        quality: 1,
        base64: false,
      });

      console.log('📝 Captured ingredients photo:', photo.uri);

      // Extract text from image using OCR
      const ocrResult = await extractTextFromImage(photo.uri);

      if (!ocrResult.success || !ocrResult.text) {
        Alert.alert(
          'No Text Found',
          'Could not read text from the image. Please try:\n\n• Taking a clearer photo\n• Ensuring good lighting\n• Getting closer to the text\n• Making sure text is in focus',
          [{ text: 'Try Again' }]
        );
        setLoading(false);
        return;
      }

      console.log('✅ OCR successful, extracted text length:', ocrResult.text.length);
      console.log('📋 Found ingredients:', ocrResult.ingredients?.slice(0, 5));

      // Try to extract product name from top of image
      const productName = extractProductName(ocrResult.text);
      console.log('🏷️ Detected product name:', productName);

      // Create search query from ingredients
      const searchQuery =
        productName ||
        (ocrResult.ingredients && ocrResult.ingredients.length > 0
          ? createSearchQueryFromIngredients(ocrResult.ingredients)
          : ocrResult.text.substring(0, 100));

      console.log('🔍 Searching with query:', searchQuery);

      // Search for products matching the ingredients
      const searchResults = await searchProducts(searchQuery, 1);

      if (searchResults.products && searchResults.products.length > 0) {
        // Navigate to product result
        const product = searchResults.products[0].product;
        if (product) {
          router.replace({
            pathname: '/product-result',
            params: {
              barcode: 'OCR_SCAN',
              name: product.name,
              brand: product.brand || 'Unknown',
              category: product.category || 'Personal Care',
              imageUrl: product.imageUrl || '',
              ingredientsText: product.ingredientsText || '',
            },
          });
        }
      } else {
        Alert.alert(
          'No Products Found',
          'Could not find any products matching these ingredients. The product might not be in our database yet.',
          [
            { text: 'Try Again' },
            {
              text: 'View Ingredients',
              onPress: () => {
                Alert.alert(
                  'Detected Ingredients',
                  ocrResult.ingredients?.slice(0, 10).join(', ') || 'No ingredients parsed'
                );
              },
            },
          ]
        );
        setLoading(false);
      }
    } catch (error) {
      console.error('Error processing ingredients photo:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Freshies needs camera access to scan ingredient lists.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        ref={cameraRef}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color={colors.white} size={28} />
        </TouchableOpacity>
      </View>

      {/* Instructions - Fades out after 3 seconds */}
      <Animated.View style={[styles.instructions, { opacity: fadeAnim }]}>
        <View style={styles.iconContainer}>
          <FileText color={colors.white} size={48} strokeWidth={1.5} />
        </View>
        <Text style={styles.instructionTitle}>Capture ingredient list</Text>
        <Text style={styles.instructionText}>
          Position the ingredient list clearly in frame
        </Text>
      </Animated.View>

      {/* Capture Button */}
      <View style={styles.captureContainer}>
        <TouchableOpacity
          style={[styles.captureButton, loading && styles.captureButtonDisabled]}
          onPress={handleTakePhoto}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.loadingText}>Processing...</Text>
          ) : (
            <Camera color={colors.white} size={28} />
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  messageText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.mint,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: radii.pill,
  },
  permissionButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: spacing[6],
    right: spacing[6],
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    position: 'absolute',
    top: height * 0.25,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  iconContainer: {
    marginBottom: spacing[4],
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
