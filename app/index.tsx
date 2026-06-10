import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { loadAuth, loadTunnelUrl } from "../services/api";
import { SvgXml } from 'react-native-svg';

const LEXAI_SVG = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 157.4">
  <path fill="${color}" d="m90.3 40.5c-0.2 4.9-0.7 12.5-0.9 14.5-0.1 0.6-0.3 1.2-0.8 1.5l-39.5 22.8c-2.7 1.5-5.1 4.7-6.4 8.5s-1 10.8-3.7 15.5-5.5 5.1-8.1 6.6l-5.7 3.7 3-36.7 0.2-0.4 44.2-24.6 17.7-11.4z"/>
  <path fill="${color}" d="m76.3 34.4c-0.3 4.2-0.4 7.7-0.4 8.7 0 0.3-0.2 0.4-0.3 0.5l-48.7 28.4c-1.2 0.7-1.5 1.2-1.6 3.5l-1.9 22.8c-0.3 2.5-3.5 3.2-12.1 8.1l3.1-35.9 0.2-0.4 27.4-15.3 34.3-20.4z"/>
  <path fill="${color}" d="m66.4 26-0.2 5.2-0.2 3.6c0 0.2-0.1 0.4-0.6 0.7l-35.5 19.9-18 10.3c-0.2 0.2-0.5 0.5-0.5 0.8l-0.7 8.6-1.5 18.4c0 0.4-0.1 0.5-0.5 0.8-2.7 1.6-7.3 3.7-7.3 3.7l2.6-30.5 0.1-1.4c0.1-1.7 0.2-4 0.4-4.2 0.2-0.5 1.4-1 2.2-1.5l10.8-5.9 33.5-18.6 15.4-9.9z"/>
  <path fill="${color}" d="m60 117.1 1.1-15.3c0.1-0.8 0.4-1.1 0.9-1.4l39.7-22c2.4-1.3 6.2-4.1 7.1-13.3 1-10.1 4.3-14.7 9-17.3l7-3.8-0.9 12.2-2 24.5-0.5 0.5-52 29.8-9.4 6.1z"/>
  <path fill="${color}" d="m73.4 123.3 0.5-8.7 0.4-0.8 48.9-27.1c1-0.6 1.4-1.4 1.4-3.2l2-24.7c0.2-1.8 1.7-2.3 3.1-3.2l8.9-5.5-2.6 32.9-0.2 4.3-0.2 0.4-26.9 15.3-35.3 20.3z"/>
  <path fill="${color}" d="m83.5 131.7 0.4-8.2 0.2-0.9 53.8-29.9c0.6-0.3 0.8-0.5 0.8-1.7l2.2-27c0-0.7 0.6-0.9 1.6-1.5l5.9-3.3-2.9 36.1c0 0.3-0.1 0.5-0.5 0.8l-32.1 18.4-29.4 17.2z"/>
  <path fill="${color}" d="m84.6 13.5v6.8l0.2 0.2s14.9-7.4 17.5-9c0.6-0.3 0.8-0.9 0.9-1.1 1.1-2.4 2.9-8.4 2.9-8.4l-21.3 11c-0.3 0.2-0.3 0.4-0.2 0.5z"/>
  <path fill="${color}" d="m69.4 29.6 7.6-3.8s3.4-1.9 3.3-1.9l0.1-0.6-0.5-6.8-0.3-0.1s-9.4 4.6-9.7 5.3l-0.1 0.3-0.4 6.1v1.5z"/>
  <path fill="${color}" d="m97.2 22-0.1 7.7 9.3-4.9 0.1-0.3-0.1-7.7-8.6 4.6-0.3 0.4-0.3 0.2z"/>
  <path fill="${color}" d="m79.1 39 0.5-7.6 0.3-0.5 11.5-6.1 0.1 7.9-0.2 0.3-11.7 5.9-0.5 0.1z"/>
  <path fill="${color}" d="m94.4 49.3c0-0.8 1-12.9 1-12.9l0.3-0.3 11.6-5.8h0.3l0.6 11.3-0.2 0.4-13.6 7.3z"/>
  <path fill="${color}" d="m113.6 21.5-0.7-0.1 2.4-8.2 9.6-5.7-3.6 9.3-0.7 0.7-7 4z"/>
  <path fill="${color}" d="m114.1 26.5 16.1-8.5c-0.3 3.2-0.9 11.9-1.7 13.9l-0.4 0.3-13.7 6.9c-0.5 0.2-0.4-12.5-0.3-12.6z"/>
  <path fill="${color}" d="m43.7 155.6 3.5-9c0.2-0.5 0.4-0.9 1-1.2l13.8-7 3.4-1.5 0.2 0.4 0.1 6.6-0.2 0.4-21.8 11.3z"/>
  <path fill="${color}" d="m25.2 150.1 3.8-9.4 0.4-0.6 8.3-4.2-0.3 7.7-0.4 0.5-11.8 6z"/>
  <path fill="${color}" d="m20 139.5 1.4-12.5c0.2-0.7 0.3-1.2 1.2-1.6l10.5-5.5 3.3-1.5 0.2 11.7-0.3 0.9c-0.4 0.3-14.3 7.5-16.3 8.5z"/>
  <path fill="${color}" d="m41.9 115.6 0.1 11.9h0.4l7.6-3.9 4.6-2.5 0.2-0.4 0.8-13.6-13.6 8.3-0.1 0.2z"/>
  <path fill="${color}" d="m43.4 132.9v7.8l9.5-4.8 0.2-0.4 0.3-7.9-9.8 5.2-0.2 0.1z"/>
  <path fill="${color}" d="m59 132.9v-7.4c0-0.6 0.2-1 0.9-1.2l10.7-5.7-0.1 1.5-0.5 6.4-0.3 0.2-5.6 3-5 2.9-0.1 0.3z"/>
  <polygon fill="${color}" points="69.4 134.1 69.8 141.5 79.5 136.4 79.7 136 80.3 127.9 69.6 133.9"/>
  <path fill="${color}" d="m113 21.5-0.1-0.1 0.2-4.4-0.1 4.5z"/>
  <path fill="${color}" d="m113 17.3 0.1-3.7 0.3-0.2-0.4 3.9z"/>
</svg>`;
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
} from "react-native-reanimated";

export default function SplashScreen() {
  const router = useRouter();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    // Check if user is already authenticated
    const checkAuth = async () => {
      // Small delay for splash animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Load tunnel URL if previously saved
      await loadTunnelUrl();

      // Always go to auth page as requested (app start -> popup -> login -> chat)
      router.replace("/auth");
    };
    checkAuth();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <SvgXml xml={LEXAI_SVG('#FFFFFF')} width="120" height="120" />
      </Animated.View>
      <Animated.Text
        entering={FadeIn.delay(500).duration(1000)}
        style={styles.title}
      >
        LexAI
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.delay(800).duration(1000)}
        style={styles.subtitle}
      >
        Your Intelligent Legal Assistant
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#FFF",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#A0A0A0",
    letterSpacing: 1,
  },
});
