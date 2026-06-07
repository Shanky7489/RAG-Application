import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { loadAuth } from "../services/api";
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
      const auth = await loadAuth();
      if (auth) {
        router.replace("/chat");
      } else {
        router.replace("/auth");
      }
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
        <View style={styles.logo}>
          <Text style={styles.logoText}>L</Text>
        </View>
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
