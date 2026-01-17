import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { X, Zap, ZapOff, Search, Image as ImageIcon, FileText, Camera } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { lookupProduct, searchProducts } from '../../../src/services/api';
import { scanBarcodeFromImage } from '../../../src/services/barcode/imageScanner';
import { extractTextFromImage, createSearchQueryFromIngredients, extractProductName } from '../../../src/services/ocr/ingredientScanner';
import { scanProduct, uploadImage } from '../../../src/services/freshiesBackend';
import { identifyProductFromImage } from '../../../src/services/ai/aiVisionProductIdentifier';
import ProductSearchModal from '../../../src/components/ProductSearchModal';
import ScanProgressOverlay, { ScanStep } from '../../../src/components/ScanProgressOverlay';
import LiveDetectionOverlay from '../../../src/components/LiveDetectionOverlay';
import { LiveDetectionResult, LiveDetectionManager } from '../../../src/services/camera/liveDetectionService';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.85;

export default function ChildScanScreen() {
  // No userRole check here - this IS the child screen
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing...');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([
    { id: 'barcode', label: 'Checking for barcode', status: 'pending' },
    { id: 'database', label: 'Searching databases', status: 'pending' },
    { id: 'ocr', label: 'Reading product label', status: 'pending' },
    { id: 'name_match', label: 'Matching product', status: 'pending' },
    { id: 'ai', label: 'AI analyzing image', status: 'pending' },
    { id: 'details', label: 'Loading details', status: 'pending' },
  ]);

  // Live detection state
  const cameraRef = useRef<any>(null);
  const [liveDetectionResult, setLiveDetectionResult] = useState<LiveDetectionResult | null>(null);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);
  const liveDetectionRef = useRef<LiveDetectionManager | null>(null);

  const updateStep = (stepId: string, status: ScanStep['status']) => {
    setScanSteps(prev => prev.map(s => s.id === stepId ? { ...s, status } : s));
  };

  const resetSteps = () => {
    setScanSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
  };

  // Request permission on mount
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Initialize live detection manager
  useEffect(() => {
    liveDetectionRef.current = new LiveDetectionManager(
      (result) => {
        setLiveDetectionResult(result);
        setIsAnalyzingFrame(false);
      },
      2500 // Analyze every 2.5 seconds
    );

    return () => {
      liveDetectionRef.current?.reset();
    };
  }, []);

  // Periodic frame capture for live detection
  useEffect(() => {
    if (!permission?.granted || loading || scanned) return;

    const captureFrame = async () => {
      if (!cameraRef.current || !liveDetectionRef.current) return;

      try {
        setIsAnalyzingFrame(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3, // Low quality for speed
          skipProcessing: true,
        });

        if (photo?.uri) {
          await liveDetectionRef.current.analyzeFrame(photo.uri);
        }
      } catch (error) {
        // Silently fail - live detection is optional enhancement
        setIsAnalyzingFrame(false);
      }
    };

    // Start periodic capture
    const intervalId = setInterval(captureFrame, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [permission?.granted, loading, scanned]);

  // Handle tapping on detected product
  const handleLiveDetectionTap = useCallback(() => {
    if (!liveDetectionResult?.productName) return;

    router.push({
      pathname: '/(child)/product-result',
      params: {
        barcode: 'LIVE_DETECTION',
        name: liveDetectionResult.productName,
        brand: liveDetectionResult.brandName || 'Unknown',
        category: liveDetectionResult.category || 'Personal Care',
        sourceType: 'ai_identified',
        confidence: (liveDetectionResult.confidence || 0.5).toString(),
        childMode: 'true',
      },
    });
  }, [liveDetectionResult]);

  const handleBarcodeScan = async ({ data }: { data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      console.log('📦 Scanned barcode:', data);
      setLoadingMessage('Looking up product...');

      // Use local product lookup cascade
      const productResult = await lookupProduct(data);

      if (productResult.found && productResult.product) {
        console.log('✅ Product found:', productResult.product.name);
        router.push({
          pathname: '/(child)/product-result',
          params: {
            barcode: data,
            name: productResult.product.name,
            brand: productResult.product.brand,
            category: productResult.product.category,
            imageUrl: productResult.product.imageUrl || '',
            ingredientsText: productResult.product.ingredientsText || '',
            childMode: 'true',
          },
        });
      } else {
        // Product not found - go to capture flow
        console.log('❌ Product not found for barcode:', data);
        router.push({
          pathname: '/product-not-found',
          params: { barcode: data },
        });
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      router.push({
        pathname: '/product-not-found',
        params: { barcode: data },
      });
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  const handleUploadFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to photos to analyze products.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setLoading(true);
        resetSteps();

        try {
          // Step 1: Try barcode detection with Cloud Vision
          updateStep('barcode', 'active');
          let barcode: string | undefined;
          try {
            const barcodeResult = await scanBarcodeFromImage(imageUri);
            if (barcodeResult.found && barcodeResult.data) {
              barcode = barcodeResult.data;
              console.log('✅ Found barcode:', barcode);
              updateStep('barcode', 'complete');
            } else {
              updateStep('barcode', 'skipped');
            }
          } catch (e) {
            console.log('ℹ️ No barcode found in image');
            updateStep('barcode', 'skipped');
          }

          // Step 2: If barcode found, lookup product in databases
          if (barcode) {
            updateStep('database', 'active');
            const productResult = await lookupProduct(barcode);

            if (productResult.found && productResult.product) {
              console.log('✅ Product found:', productResult.product.name);
              router.push({
                pathname: '/(child)/product-result',
                params: {
                  barcode: barcode,
                  name: productResult.product.name,
                  brand: productResult.product.brand,
                  category: productResult.product.category,
                  imageUrl: productResult.product.imageUrl || imageUri,
                  childMode: 'true',
                },
              });
              setLoading(false);
              return;
            }
          } else {
            updateStep('database', 'skipped');
          }

          // Step 3: Try OCR text extraction
          updateStep('ocr', 'active');
          const ocrResult = await extractTextFromImage(imageUri);

          if (ocrResult.success && ocrResult.text) {
            updateStep('ocr', 'complete');
            const productName = extractProductName(ocrResult.text);
            const searchQuery = productName ||
              (ocrResult.ingredients && ocrResult.ingredients.length > 0
                ? createSearchQueryFromIngredients(ocrResult.ingredients)
                : ocrResult.text.substring(0, 100));

            if (searchQuery) {
              updateStep('name_match', 'active');
              const searchResult = await searchProducts(searchQuery, 1);

              if (searchResult.products && searchResult.products.length > 0 && searchResult.products[0].product) {
                updateStep('name_match', 'complete');
                updateStep('details', 'complete');
                const product = searchResult.products[0].product;
                router.push({
                  pathname: '/(child)/product-result',
                  params: {
                    barcode: 'OCR_SCAN',
                    name: product.name,
                    brand: product.brand || 'Unknown',
                    category: product.category || 'Personal Care',
                    imageUrl: product.imageUrl || imageUri,
                    ingredientsText: product.ingredientsText || '',
                    sourceType: 'database',
                    childMode: 'true',
                  },
                });
                setLoading(false);
                return;
              } else {
                updateStep('name_match', 'skipped');
              }
            } else {
              updateStep('name_match', 'skipped');
            }
          } else {
            updateStep('ocr', 'skipped');
            updateStep('name_match', 'skipped');
          }

          // Step 5: Try AI Vision identification (GPT-4 Vision)
          updateStep('ai', 'active');
          const aiResult = await identifyProductFromImage(imageUri);

          if (aiResult.success && aiResult.product_name) {
            updateStep('ai', 'complete');
            console.log('✅ AI identified product:', aiResult.product_name, 'by', aiResult.brand_name);

            // Step 6: Try to find the AI-identified product in our database for scoring
            updateStep('details', 'active');
            const searchQuery = `${aiResult.brand_name || ''} ${aiResult.product_name}`.trim();
            const dbResult = await searchProducts(searchQuery, 1);

            if (dbResult.products && dbResult.products.length > 0 && dbResult.products[0].product) {
              // Found in database - use DB data for proper scoring
              updateStep('details', 'complete');
              const dbProduct = dbResult.products[0].product;
              console.log('✅ Found AI product in database:', dbProduct.name);

              const ingredientsData = {
                normalised: dbProduct.ingredientsText
                  ? dbProduct.ingredientsText.split(',').map((i: string) => i.trim()).filter((i: string) => i)
                  : aiResult.key_ingredients || [],
                rawText: dbProduct.ingredientsText || aiResult.key_ingredients?.join(', ') || ''
              };

              router.push({
                pathname: '/(child)/product-result',
                params: {
                  barcode: 'AI_VISION',
                  name: dbProduct.name,
                  brand: dbProduct.brand || aiResult.brand_name || 'Unknown',
                  category: dbProduct.category || aiResult.category || 'Personal Care',
                  size: aiResult.size || '', // Add size from AI
                  imageUrl: imageUri || dbProduct.imageUrl, // Prefer user's photo
                  ingredients: JSON.stringify(ingredientsData),
                  confidence: '0.9',
                  sourceType: 'database',
                  childMode: 'true',
                },
              });
            } else {
              // Not in database - show AI-identified data with indicator
              updateStep('details', 'skipped');
              console.log('ℹ️ AI product not in database, showing with review prompt');

              // Don't pass key_ingredients as real ingredients - they're just marketing bullet points
              // Real ingredients would need to come from the actual INCI list on the back
              const aiIngredientsData = {
                normalised: [],
                rawText: ''
              };

              router.push({
                pathname: '/(child)/product-result',
                params: {
                  barcode: 'AI_VISION',
                  name: aiResult.product_name,
                  brand: aiResult.brand_name || 'Unknown',
                  category: aiResult.category || 'Personal Care',
                  size: aiResult.size || '', // Add size from AI
                  imageUrl: imageUri,
                  ingredients: JSON.stringify(aiIngredientsData),
                  confidence: (aiResult.confidence || 0.5).toString(),
                  sourceType: 'ai_identified',
                  childMode: 'true',
                },
              });
            }
            setLoading(false);
            return;
          }
          updateStep('ai', 'skipped');
          console.log('⚠️ AI Vision could not identify:', aiResult.error);

          // Step 6: All methods failed - go to Product Not Found flow
          setLoading(false);
          router.push({
            pathname: '/product-not-found',
            params: {
              imageUri: imageUri,
              barcode: barcode,
            },
          });

        } catch (e) {
          console.error('Error analyzing image:', e);
          setLoading(false);
          router.push({
            pathname: '/product-not-found',
            params: { imageUri: imageUri },
          });
        }
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const handlePhotoIngredients = () => {
    router.push('/(child)/ingredient-camera');
  };

  const handleCapturePhoto = async () => {
    try {
      // Check if we can use camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to capture product photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setLoading(true);
        resetSteps();

        try {
          // Step 1: Try barcode detection with Cloud Vision
          updateStep('barcode', 'active');
          let barcode: string | undefined;
          try {
            const barcodeResult = await scanBarcodeFromImage(imageUri);
            if (barcodeResult.found && barcodeResult.data) {
              barcode = barcodeResult.data;
              console.log('✅ Found barcode:', barcode);
              updateStep('barcode', 'complete');
            } else {
              updateStep('barcode', 'skipped');
            }
          } catch (e) {
            console.log('ℹ️ No barcode found in image');
            updateStep('barcode', 'skipped');
          }

          // Step 2: If barcode found, lookup product in databases
          if (barcode) {
            updateStep('database', 'active');
            const productResult = await lookupProduct(barcode);

            if (productResult.found && productResult.product) {
              console.log('✅ Product found:', productResult.product.name);
              router.push({
                pathname: '/(child)/product-result',
                params: {
                  barcode: barcode,
                  name: productResult.product.name,
                  brand: productResult.product.brand,
                  category: productResult.product.category,
                  imageUrl: productResult.product.imageUrl || imageUri,
                  childMode: 'true',
                },
              });
              setLoading(false);
              return;
            }
          } else {
            updateStep('database', 'skipped');
          }

          // Step 3: Try AI Vision identification
          updateStep('ocr', 'skipped');
          updateStep('name_match', 'skipped');
          updateStep('ai', 'active');
          const aiResult = await identifyProductFromImage(imageUri);

          if (aiResult.success && aiResult.product_name) {
            updateStep('ai', 'complete');
            updateStep('details', 'active');

            const searchQuery = `${aiResult.brand_name || ''} ${aiResult.product_name}`.trim();
            const dbResult = await searchProducts(searchQuery, 1);

            if (dbResult.products && dbResult.products.length > 0 && dbResult.products[0].product) {
              updateStep('details', 'complete');
              const dbProduct = dbResult.products[0].product;
              router.push({
                pathname: '/(child)/product-result',
                params: {
                  barcode: 'CAMERA_CAPTURE',
                  name: dbProduct.name,
                  brand: dbProduct.brand || aiResult.brand_name || 'Unknown',
                  category: dbProduct.category || aiResult.category || 'Personal Care',
                  imageUrl: imageUri,
                  sourceType: 'database',
                  childMode: 'true',
                },
              });
            } else {
              updateStep('details', 'skipped');
              router.push({
                pathname: '/(child)/product-result',
                params: {
                  barcode: 'CAMERA_CAPTURE',
                  name: aiResult.product_name,
                  brand: aiResult.brand_name || 'Unknown',
                  category: aiResult.category || 'Personal Care',
                  imageUrl: imageUri,
                  confidence: (aiResult.confidence || 0.5).toString(),
                  sourceType: 'ai_identified',
                  childMode: 'true',
                },
              });
            }
            setLoading(false);
            return;
          }
          updateStep('ai', 'skipped');

          // All methods failed
          setLoading(false);
          router.push({
            pathname: '/product-not-found',
            params: { imageUri: imageUri, barcode: barcode },
          });

        } catch (e) {
          console.error('Error analyzing captured image:', e);
          setLoading(false);
          router.push({
            pathname: '/product-not-found',
            params: { imageUri: imageUri },
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('Error launching camera:', error);
      setLoading(false);

      // Show user-friendly message
      if (errorMessage.includes('simulator') || errorMessage.includes('not available')) {
        Alert.alert(
          'Camera Not Available',
          'Camera capture requires a real device. Use the Upload button to select an image from your photo library instead.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>We need camera access to scan products.</Text>
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
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
        enableTorch={torchOn}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color={colors.white} size={28} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.torchButton}
          onPress={() => setTorchOn(!torchOn)}
        >
          {torchOn ? <Zap color={colors.yellow} size={28} fill={colors.yellow} /> : <ZapOff color={colors.white} size={28} />}
        </TouchableOpacity>
      </View>

      {/* Frame & Overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            {/* Old inline loading removed - using ScanProgressOverlay instead */}
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Scan Product</Text>
        <Text style={styles.instructionText}>Center barcode in the square</Text>
      </View>

      {/* Live Detection Overlay */}
      <LiveDetectionOverlay
        result={liveDetectionResult}
        onTap={handleLiveDetectionTap}
        onDismiss={() => {
          setLiveDetectionResult(null);
          liveDetectionRef.current?.reset();
        }}
        isAnalyzing={isAnalyzingFrame}
      />

      {/* Fan Menu */}
      <View style={styles.fanMenuContainer}>
        <TouchableOpacity
          style={[styles.fanOption, styles.fanOptionLeft, styles.purpleOption]}
          onPress={handleUploadFromLibrary}
        >
          <ImageIcon color={colors.white} size={24} />
          <Text style={styles.fanOptionLabel}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fanOption, styles.fanOptionCenter, styles.mintOption]}
          onPress={handleCapturePhoto}
        >
          <Camera color={colors.black} size={24} />
          <Text style={styles.fanOptionLabel}>Capture</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fanOption, styles.fanOptionRight, styles.yellowOption]}
          onPress={handlePhotoIngredients}
        >
          <FileText color={colors.black} size={24} />
          <Text style={styles.fanOptionLabel}>Ingredients</Text>
        </TouchableOpacity>
      </View>

      <ProductSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onProductSelect={(product) => {
          setShowSearchModal(false);
          router.push({
            pathname: '/(child)/product-result',
            params: {
              barcode: product.id,
              name: product.name,
              brand: product.brand,
              childMode: 'true',
            },
          });
        }}
      />

      {/* Progress overlay for scanning */}
      <ScanProgressOverlay
        visible={loading}
        steps={scanSteps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  permissionTitle: { fontSize: 24, fontWeight: '700', color: colors.white, marginBottom: spacing[3] },
  permissionText: { fontSize: 16, color: colors.white, textAlign: 'center', marginBottom: spacing[6] },
  permissionButton: { backgroundColor: colors.mint, paddingHorizontal: spacing[6], paddingVertical: spacing[4], borderRadius: radii.pill },
  permissionButtonText: { color: colors.black, fontWeight: '600' },
  header: { position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 100 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  torchButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', marginTop: -80 },
  overlayTop: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', width: '100%' },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  scanArea: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, borderRadius: radii.lg, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: 'rgba(167, 243, 208, 0.5)', borderWidth: 4 },
  cornerTopLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: radii.lg },
  cornerTopRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: radii.lg },
  cornerBottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: radii.lg },
  cornerBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: radii.lg },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', borderRadius: radii.lg },
  loadingText: { color: colors.white, fontWeight: '600' },
  instructions: { position: 'absolute', top: 140, width: SCAN_AREA_SIZE, alignSelf: 'center' },
  instructionTitle: { fontSize: 24, fontWeight: '700', color: colors.white, textAlign: 'center', width: '100%' },
  instructionText: { fontSize: 14, color: colors.white, textAlign: 'center', width: '100%', opacity: 0.8 },
  fanMenuContainer: { position: 'absolute', bottom: 140, alignSelf: 'center', width: 280, height: 100 },
  fanOption: { position: 'absolute', width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fanOptionLeft: { left: 0, bottom: 20 },
  fanOptionCenter: { left: 108, bottom: 36 },
  fanOptionRight: { right: 0, bottom: 20 },
  purpleOption: { backgroundColor: colors.purple },
  mintOption: { backgroundColor: colors.mint },
  yellowOption: { backgroundColor: colors.yellow },
  fanOptionLabel: { position: 'absolute', bottom: -20, color: colors.white, fontSize: 11, fontWeight: '700', width: 80, textAlign: 'center' },
});
