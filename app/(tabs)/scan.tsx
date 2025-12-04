import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { X, Zap, ZapOff, Search, Image as ImageIcon, FileText, MoreHorizontal, ScanBarcode } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { lookupProduct, searchProducts } from '../../src/services/api';
import { scanBarcodeFromImage } from '../../src/services/barcode/imageScanner';
import { extractTextFromImage, createSearchQueryFromIngredients, extractProductName } from '../../src/services/ocr/ingredientScanner';
import { scanProduct, submitScanFeedback, uploadImage } from '../../src/services/freshiesBackend';
import ProductSearchModal from '../../src/components/ProductSearchModal';
import { useAuth } from '../../contexts/AuthContext';
import ChildScanScreen from '../(child)/(tabs)/scan';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.85;

export default function ScanScreen() {
  const { userRole } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing...');
  const [showHeader, setShowHeader] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // If user is a child, show the child scan screen
  if (userRole === 'child') {
    return <ChildScanScreen />;
  }

  // Request permission on mount
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScan = async ({ data }: { data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      console.log('📦 Scanned barcode:', data);
      
      // Use Freshies backend for comprehensive analysis
      const scanResult = await scanProduct({
        barcodeHint: data,
        // TODO: Get child profile from context/storage
        childProfile: {
          age: 8,
          skinType: 'normal',
          allergies: [],
        },
      });
      
      // Navigate to product result screen with full analysis
      router.push({
        pathname: '/product-result',
        params: {
          scanId: scanResult.scanId,
          barcode: scanResult.product?.barcode || data,
          name: scanResult.product?.name || 'Unknown Product',
          brand: scanResult.product?.brand || 'Unknown Brand',
          category: scanResult.product?.category || 'Personal Care',
          imageUrl: '',
          ingredientsText: scanResult.ingredients.rawText || '',
          // Safety scoring
          riskScore: scanResult.scoring.riskScore.toString(),
          rating: scanResult.scoring.rating,
          modelVersion: scanResult.scoring.modelVersion,
        },
      });
    } catch (error) {
      console.error('Error processing barcode:', error);
      
      // Fallback to old API if backend is down
      try {
        const result = await lookupProduct(data);
        if (result.found && result.product) {
          router.push({
            pathname: '/product-result',
            params: {
              barcode: data,
              name: result.product.name,
              brand: result.product.brand,
              category: result.product.category,
              imageUrl: result.product.imageUrl || '',
              ingredientsText: result.product.ingredientsText || '',
            },
          });
        } else {
          Alert.alert(
            'Product Not Found',
            `We haven't seen this product before (barcode: ${data}). Would you like to help us add it?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
              { 
                text: 'Add Product', 
                onPress: () => {
                  Alert.alert('Coming Soon', 'Manual product entry will be available soon!');
                  setScanned(false);
                }
              },
            ]
          );
        }
      } catch (fallbackError) {
        Alert.alert(
          'Scan Error',
          'Something went wrong. Please try again.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    Alert.prompt(
      'Enter Barcode',
      'Type the barcode number from the product',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search',
          onPress: async (barcode?: string) => {
            if (barcode && barcode.trim().length >= 8) {
              setLoading(true);
              try {
                const result = await lookupProduct(barcode.trim());
                if (result.found && result.product) {
                  router.push({
                    pathname: '/product-result',
                    params: {
                      barcode: barcode.trim(),
                      name: result.product.name,
                      brand: result.product.brand,
                      category: result.product.category,
                      imageUrl: result.product.imageUrl || '',
                      ingredientsText: result.product.ingredientsText || '',
                    },
                  });
                } else {
                  Alert.alert('Product Not Found', `No product found for barcode: ${barcode}`);
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to look up product');
              } finally {
                setLoading(false);
              }
            } else {
              Alert.alert('Invalid Barcode', 'Please enter at least 8 digits');
            }
          },
        },
      ],
      'plain-text',
      '',
      'number-pad'
    );
  };

  const handleUploadFromLibrary = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to analyze product images.'
        );
        return;
      }

      // Launch image picker with editing to allow cropping
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📷 Selected image:', imageUri);
        
        setLoading(true);
        
        try {
          // Upload image to backend first
          setLoadingMessage('Uploading image...');
          const { imageUrl } = await uploadImage(imageUri);
          console.log('✅ Image uploaded:', imageUrl);
          
          // Try multiple methods to identify the product
          console.log('🔍 Analyzing image...');
          
          // 1. Try barcode detection first
          setLoadingMessage('Scanning for barcode...');
          let barcode: string | undefined;
          try {
            const barcodeResult = await scanBarcodeFromImage(imageUri);
            if (barcodeResult.found && barcodeResult.data) {
              barcode = barcodeResult.data;
              console.log('✅ Found barcode:', barcode);
            }
          } catch (e) {
            console.log('No barcode found, trying AI...');
          }

          // 2. Send to backend for comprehensive analysis (with uploaded image URL)
          setLoadingMessage('Analyzing with AI...');
          const scanResult = await scanProduct({
            imageUrl, // Send public HTTP URL
            barcodeHint: barcode,
            childProfile: {
              age: 8,
              skinType: 'normal',
              allergies: [],
            },
          });

          // Check if we got useful results
          if (!scanResult.product || scanResult.scoring.rating === 'UNKNOWN' || scanResult.ingredients.normalised.length === 0) {
            Alert.alert(
              'Product Not Found',
              'We couldn\'t find this product in our database or extract ingredients. Please try:\n\n• Scanning the back of the package where ingredients are listed\n• Taking a clearer photo with good lighting\n• Ensuring the barcode is visible\n• Trying a different angle',
              [
                { text: 'Try Again', onPress: handleUploadFromLibrary },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
            setLoading(false);
            return;
          }

          // Navigate to results with full scan data
          router.push({
            pathname: '/product-result',
            params: {
              scanId: scanResult.scanId,
              barcode: scanResult.product?.barcode || barcode || 'UNKNOWN',
              name: scanResult.product?.name || 'Unknown Product',
              brand: scanResult.product?.brand || 'Unknown Brand',
              category: scanResult.product?.category || 'Personal Care',
              size: (scanResult.product as any)?.size || '',
              description: (scanResult.product as any)?.description || '',
              // Use product imageUrl from database if available, otherwise user's uploaded image
              imageUrl: (scanResult.product as any)?.imageUrl || imageUri,
              confidence: scanResult.product?.confidence?.toString() || '0',
              // Pass full data as JSON strings
              ingredients: JSON.stringify(scanResult.ingredients),
              scoring: JSON.stringify(scanResult.scoring),
            },
          });
        } catch (error) {
          console.error('Error analyzing image:', error);
          Alert.alert(
            'Analysis Failed',
            'Could not identify the product from this image. Try:\n\n• Taking a clearer photo of the product label\n• Ensuring good lighting\n• Including the product name and brand\n• Using the live camera scanner instead',
            [
              { text: 'Try Again', onPress: handleUploadFromLibrary },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from library');
      setLoading(false);
    }
  };

  const handlePhotoIngredients = () => {
    // Navigate to dedicated ingredient camera screen
    router.push('/ingredient-camera');
  };

  const handlePhotoIngredientsOld = async () => {
    try {
      // Request camera permissions for taking photo
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera access to take photos of ingredient lists.'
        );
        return;
      }

      // Launch camera to take photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Don't crop - need full ingredient list
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📝 Captured ingredients photo:', imageUri);
        
        setLoading(true);
        
        try {
          // Extract text from image using OCR
          const ocrResult = await extractTextFromImage(imageUri);
          
          if (!ocrResult.success || !ocrResult.text) {
            Alert.alert(
              'No Text Found',
              'Could not read text from the image. Please try:\n\n• Taking a clearer photo\n• Ensuring good lighting\n• Getting closer to the text\n• Making sure text is in focus'
            );
            return;
          }

          console.log('✅ OCR successful, extracted text length:', ocrResult.text.length);
          console.log('📋 Found ingredients:', ocrResult.ingredients?.slice(0, 5));

          // Try to extract product name from top of image
          const productName = extractProductName(ocrResult.text);
          console.log('🏷️ Detected product name:', productName);

          // Create search query from ingredients
          const searchQuery = productName || 
            (ocrResult.ingredients && ocrResult.ingredients.length > 0
              ? createSearchQueryFromIngredients(ocrResult.ingredients)
              : ocrResult.text.substring(0, 100));

          console.log('🔍 Searching with query:', searchQuery);

          // Search for products matching the ingredients
          const searchResults = await searchProducts(searchQuery, 1);

          if (searchResults.products && searchResults.products.length > 0) {
            // Show results to user
            Alert.alert(
              'Products Found!',
              `Found ${searchResults.total} matching products. Showing first result.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'View Product',
                  onPress: () => {
                    const product = searchResults.products[0].product;
                    if (product) {
                      router.push({
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
                  },
                },
              ]
            );
          } else {
            Alert.alert(
              'No Products Found',
              'Could not find any products matching these ingredients. The product might not be in our database yet.',
              [
                { text: 'OK' },
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
          }
        } catch (error) {
          console.error('Error processing ingredients photo:', error);
          Alert.alert('Error', 'Failed to process image. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
      setLoading(false);
    }
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Loading camera...</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Freshies needs camera access to scan product barcodes.
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
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13', 'ean8', 'upc_a', 'upc_e',
            'code128', 'code39', 'codabar', 'itf14'
          ],
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
            {torchOn ? (
              <Zap color={colors.yellow} size={28} fill={colors.yellow} />
            ) : (
              <ZapOff color={colors.white} size={28} />
            )}
          </TouchableOpacity>
      </View>

      {/* Scan Area Overlay */}
      <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.overlayTop} />
          
          {/* Middle row with scan area */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              {/* Corner brackets */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              
              {loading && (
                <View style={styles.loadingOverlay}>
                  <Text style={styles.loadingText}>{loadingMessage}</Text>
                </View>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>
          
          {/* Bottom overlay */}
          <View style={styles.overlayBottom} />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Capture Product Details</Text>
          <Text style={styles.instructionText}>Scan barcode, upload photo, or search manually</Text>
      </View>

      {/* Fan Menu Arc */}
      <View style={styles.fanMenuContainer}>
          {/* Upload from Library - Left (Purple) */}
          <TouchableOpacity 
            style={[styles.fanOption, styles.fanOptionLeft, styles.purpleOption]}
            onPress={handleUploadFromLibrary}
          >
            <ImageIcon color={colors.white} size={24} />
            <Text style={styles.fanOptionLabel}>Upload</Text>
          </TouchableOpacity>

          {/* Manual Search - Center (Mint) */}
          <TouchableOpacity 
            style={[styles.fanOption, styles.fanOptionCenter, styles.mintOption]}
            onPress={() => setShowSearchModal(true)}
          >
            <Search color={colors.black} size={24} />
            <Text style={styles.fanOptionLabel}>Search</Text>
          </TouchableOpacity>

          {/* Photo of Ingredients - Right (Yellow) */}
          <TouchableOpacity 
            style={[styles.fanOption, styles.fanOptionRight, styles.yellowOption]}
            onPress={handlePhotoIngredients}
          >
            <FileText color={colors.black} size={24} />
            <Text style={styles.fanOptionLabel}>Ingredients</Text>
          </TouchableOpacity>
      </View>

      {/* Product Search Modal */}
      <ProductSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onProductSelect={(product) => {
          setShowSearchModal(false);
          router.push({
            pathname: '/product-result',
            params: {
              barcode: product.id,
              name: product.name,
              brand: product.brand,
              category: 'Personal Care',
              imageUrl: product.imageUrl || '',
            },
          });
        }}
      />
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
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing[6],
    zIndex: 100,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -80,
  },
  overlayTop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    width: '100%',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayBottom: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    borderWidth: 0.5,
    borderColor: 'rgba(167, 243, 208, 0.2)',
    borderRadius: radii.lg,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'rgba(167, 243, 208, 0.3)',
  },
  cornerTopLeft: {
    top: -0.5,
    left: -0.5,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: radii.lg,
  },
  cornerTopRight: {
    top: -0.5,
    right: -0.5,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: radii.lg,
  },
  cornerBottomLeft: {
    bottom: -0.5,
    left: -0.5,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: radii.lg,
  },
  cornerBottomRight: {
    bottom: -0.5,
    right: -0.5,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: radii.lg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.lg,
  },
  loadingText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    width: SCAN_AREA_SIZE,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[2],
    textAlign: 'center',
    width: '100%',
  },
  instructionText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    width: '100%',
  },
  fanMenuContainer: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    width: 280,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanOption: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fanOptionLeft: {
    left: 0,
    bottom: 20,
  },
  fanOptionCenter: {
    left: 108,
    bottom: 36,
  },
  fanOptionRight: {
    right: 0,
    bottom: 20,
  },
  purpleOption: {
    backgroundColor: colors.purple,
  },
  mintOption: {
    backgroundColor: colors.mint,
  },
  yellowOption: {
    backgroundColor: colors.yellow,
  },
  fanOptionLabel: {
    position: 'absolute',
    bottom: -22,
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    width: 80,
  },
});
