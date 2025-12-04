import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function ChildWelcomeSplash() {
  const router = useRouter();
  const { user } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const [userName, setUserName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current;
  const leftCardAnim = useRef(new Animated.Value(-30)).current;
  const rightCardAnim = useRef(new Animated.Value(30)).current;
  const leftImageAnim = useRef(new Animated.Value(-100)).current;
  const rightImageAnim = useRef(new Animated.Value(100)).current;
  const centerImageScaleAnim = useRef(new Animated.Value(1.1)).current;

  const navigateToHome = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/(child)/home');
    });
  };

  useEffect(() => {
    // Fetch user name
    async function fetchUserName() {
      if (user?.id) {
        const { supabase } = await import('../../lib/supabase');
        
        // First try to get from child_profiles
        const { data: childProfile } = await supabase
          .from('child_profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        if (childProfile?.display_name) {
          setUserName(childProfile.display_name);
        } else {
          // Fallback to profiles.first_name
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', user.id)
            .single();
          
          if (profile?.first_name) {
            setUserName(profile.first_name);
          }
        }
      }
    }
    
    fetchUserName();

    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(imageScaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate side cards with continuous movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(leftCardAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(leftCardAnim, {
          toValue: -30,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rightCardAnim, {
          toValue: 0,
          duration: 2000,
          delay: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rightCardAnim, {
          toValue: 30,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animate hero images sliding in
    Animated.parallel([
      Animated.spring(leftImageAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(rightImageAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate center image with subtle zoom
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerImageScaleAnim, {
          toValue: 1.05,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(centerImageScaleAnim, {
          toValue: 1.1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Show button after 1 second
    setTimeout(() => {
      Animated.timing(buttonOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1000);

    // Auto-navigate after 8 seconds if user doesn't click
    const timer = setTimeout(() => {
      navigateToHome();
    }, 8000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Starry Background */}
      <View style={styles.gradient}>
        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                opacity: Math.random() * 0.7 + 0.3,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Top Section - Header */}
        <View style={styles.topSection}>
          <Text style={styles.headerText}>Your skin journey</Text>
          <Text style={styles.subheaderText}>
            Track your routine, scan products, and glow up! ✨
          </Text>
        </View>

        {/* Middle Section - Cards */}
        <Animated.View 
          style={[
            styles.imageContainer,
            {
              transform: [{ scale: imageScaleAnim }],
            },
          ]}
        >
          {/* Main Image Card */}
          <View style={styles.mainCard}>
            {/* Background Image with Animation */}
            <Animated.Image
              source={require('../../assets/images/welcome-hero-centre.png')}
              style={[
                styles.mainCardImage,
                {
                  transform: [{ scale: centerImageScaleAnim }]
                }
              ]}
              resizeMode="cover"
            />
            
            {/* Dark Gradient Overlay for better text readability */}
            <View style={styles.cardGradientOverlay} />
            
            {/* Text Overlay */}
            <View style={styles.cardOverlay}>
              <Sparkles size={40} color={colors.yellow} strokeWidth={2.5} />
              <Text style={styles.cardText}>Welcome back,</Text>
              <Text style={styles.cardName}>{userName || 'there'}!</Text>
            </View>
          </View>

          {/* Side Cards with Hero Images */}
          <Animated.View 
            style={[
              styles.sideCard, 
              styles.leftCard,
              {
                transform: [
                  { translateX: leftCardAnim },
                  { rotate: '-10deg' }
                ]
              }
            ]}
          >
            <Image
              source={require('../../assets/images/welcome-hero-left.jpg')}
              style={styles.sideCardImage}
              resizeMode="cover"
            />
            <View style={styles.miniCardOverlay}>
              <Text style={styles.miniEmoji}>🧴</Text>
            </View>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.sideCard, 
              styles.rightCard,
              {
                transform: [
                  { translateX: rightCardAnim },
                  { rotate: '10deg' }
                ]
              }
            ]}
          >
            <Image
              source={require('../../assets/images/welcome-hero-right.jpg')}
              style={styles.sideCardImage}
              resizeMode="cover"
            />
            <View style={styles.miniCardOverlay}>
              <Text style={styles.miniEmoji}>✨</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Bottom Section - Text and Button */}
        <View style={styles.bottomSection}>
          <Text style={styles.bottomText}>
            Let's keep your skin healthy and glowing
          </Text>

          {/* Get Started Button */}
          <Animated.View style={{ opacity: buttonOpacityAnim, marginTop: spacing[6] }}>
            <TouchableOpacity
              onPress={navigateToHome}
              disabled={isNavigating}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Get started</Text>
              <ArrowRight size={20} color={colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0b2e',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#1a0b2e',
  },
  star: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: height * 0.12,
    paddingBottom: height * 0.08,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subheaderText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  imageContainer: {
    width: width * 0.85,
    height: width * 1.0,
    marginVertical: spacing[6],
    position: 'relative',
  },
  mainCard: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  mainCardImage: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    left: '-5%',
    top: '-5%',
  },
  cardGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: radii.xxl,
  },
  cardOverlay: {
    position: 'absolute',
    top: spacing[6],
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  cardText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing[2],
    marginBottom: spacing[1],
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  cardName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.yellow,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  sideCard: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.5,
    backgroundColor: colors.mint,
    borderRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  leftCard: {
    left: -width * 0.12,
    top: '30%',
  },
  rightCard: {
    right: -width * 0.12,
    top: '40%',
    backgroundColor: colors.peach,
  },
  miniCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideCardImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radii.xl,
  },
  miniCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniEmoji: {
    fontSize: 40,
  },
  bottomText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radii.pill,
    gap: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  topSection: {
    alignItems: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
});
