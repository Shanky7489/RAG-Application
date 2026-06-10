import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { login, saveAuth, loadTunnelUrl, setTunnelUrl, checkServerConnection } from "../services/api";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
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
import {
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Server,
} from "lucide-react-native";

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(false);
  
  const [showTunnelModal, setShowTunnelModal] = useState(false);
  const [tunnelUrlInput, setTunnelUrlInput] = useState("");
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [tunnelError, setTunnelError] = useState("");

  useEffect(() => {
    const checkTunnel = async () => {
      const url = await loadTunnelUrl();
      if (url) {
        setTunnelUrlInput(url);
      }
      // Always show tunnel popup on start so user can verify/update the URL
      setShowTunnelModal(true);
    };
    checkTunnel();
  }, []);

  const handleSaveTunnel = async () => {
    if (tunnelUrlInput.trim()) {
      setTunnelLoading(true);
      setTunnelError("");
      
      const isReachable = await checkServerConnection(tunnelUrlInput.trim());
      
      if (!isReachable) {
        setTunnelError("Cannot connect to server. Please check the URL.");
        setTunnelLoading(false);
        return;
      }

      await setTunnelUrl(tunnelUrlInput.trim());
      setTunnelLoading(false);
      setShowTunnelModal(false);
    }
  };

  const canLogin = email.trim().length > 0 && password.trim().length > 0 && !isLoading;

  const handleLogin = async () => {
    if (canLogin) {
      setIsLoading(true);
      try {
        // use email as username for login since the backend now checks both
        const result = await login(email, password);
        await saveAuth({ user_id: result.user_id, username: result.username });
        router.replace("/chat");
      } catch (error: any) {
        alert(error?.response?.data?.detail || "Failed to sign in");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={styles.shell}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeIn.duration(450)}
            style={styles.formPane}
          >
            <View style={styles.brandRow}>
              <View style={{ marginRight: 8 }}>
                <SvgXml xml={LEXAI_SVG('#E7E9EA')} width="26" height="26" />
              </View>
              <Text style={styles.brandName}>LexAI</Text>
            </View>

            <View style={styles.heroTextWrap}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your intelligent legal workspace.
              </Text>
            </View>

            <Animated.View
              entering={FadeInUp.delay(120).duration(500)}
              style={styles.form}
            >
              <View style={styles.fieldContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View
                  style={[
                    styles.inputGroup,
                    focusedField === "email" && styles.inputGroupFocused,
                  ]}
                >
                  <Mail
                    color={focusedField === "email" ? "#E7E9EA" : "#71767B"}
                    size={19}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#71767B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View
                  style={[
                    styles.inputGroup,
                    focusedField === "password" && styles.inputGroupFocused,
                  ]}
                >
                  <Lock
                    color={focusedField === "password" ? "#E7E9EA" : "#71767B"}
                    size={19}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#71767B"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <EyeOff color="#71767B" size={19} />
                    ) : (
                      <Eye color="#71767B" size={19} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                activeOpacity={0.75}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  !canLogin && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!canLogin}
                activeOpacity={0.82}
              >
                <Text
                  style={[
                    styles.loginButtonText,
                    !canLogin && styles.loginButtonTextDisabled,
                  ]}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Text>
                <ArrowRight
                  color={canLogin ? "#000000" : "#5B6068"}
                  size={19}
                />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.signupPrompt}
              onPress={() => router.push("/signup")}
              activeOpacity={0.7}
            >
              <Text style={styles.signupPromptText}>
                Don't have an account?{" "}
                <Text style={styles.signupLinkText}>Sign up</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <ShieldCheck size={15} color="#71767B" />
              <Text style={styles.footerText}>Protected workspace access</Text>
            </View>

            <TouchableOpacity 
              style={styles.serverConfigBtn}
              onPress={() => setShowTunnelModal(true)}
            >
              <Server size={14} color="#71767B" />
              <Text style={styles.serverConfigText}>Server Config</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        <Modal
          visible={showTunnelModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Server size={24} color="#E7E9EA" />
                <Text style={styles.modalTitle}>Server Configuration</Text>
              </View>
              <Text style={styles.modalSubtitle}>
                Please enter the backend tunnel URL provided by your developer.
              </Text>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.inputLabel}>Tunnel Link</Text>
                <View style={[styles.inputGroup, tunnelError ? { borderColor: '#F87171' } : { marginBottom: 20 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="https://your-tunnel-url.com"
                    placeholderTextColor="#71767B"
                    value={tunnelUrlInput}
                    onChangeText={(val) => {
                      setTunnelUrlInput(val);
                      if (tunnelError) setTunnelError("");
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {tunnelError ? (
                  <Text style={styles.errorText}>{tunnelError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  !tunnelUrlInput.trim() && styles.loginButtonDisabled,
                ]}
                onPress={handleSaveTunnel}
                disabled={!tunnelUrlInput.trim() || tunnelLoading}
              >
                <Text
                  style={[
                    styles.loginButtonText,
                    !tunnelUrlInput.trim() && styles.loginButtonTextDisabled,
                  ]}
                >
                  {tunnelLoading ? "Saving..." : "Save Server URL"}
                </Text>
                <ArrowRight
                  color={tunnelUrlInput.trim() ? "#000000" : "#5B6068"}
                  size={19}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  shell: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  formPane: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#E7E9EA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brandName: {
    color: "#E7E9EA",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0,
    marginTop: 4,
  },
  heroTextWrap: {
    marginBottom: 30,
  },
  title: {
    color: "#E7E9EA",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 10,
  },
  subtitle: {
    color: "#71767B",
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
    width: "100%",
  },
  inputLabel: {
    color: "#E7E9EA",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    backgroundColor: "#101114",
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#2F3336",
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(135deg, #13151A 0%, #101114 50%, #08080A 100%)",
        transition: "all 0.2s ease",
        boxShadow: "0 10px 28px rgba(0,0,0,0.20)",
      } as any,
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputGroupFocused: {
    borderColor: "#5B6068",
    ...Platform.select({
      web: {
        boxShadow:
          "0 0 0 1px rgba(231,233,234,0.14), 0 14px 34px rgba(0,0,0,0.42)",
      } as any,
    }),
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  input: {
    flex: 1,
    color: "#E7E9EA",
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 10,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      } as any,
    }),
  },
  forgotPassword: {
    alignSelf: "flex-end",
    paddingVertical: 2,
  },
  forgotPasswordText: {
    color: "#AAB0B8",
    fontSize: 13,
    fontWeight: "600",
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7E9EA",
    marginTop: 6,
    ...Platform.select({
      web: {
        boxShadow: "0 14px 36px rgba(231,233,234,0.12)",
      } as any,
      ios: {
        shadowColor: "#E7E9EA",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  loginButtonDisabled: {
    backgroundColor: "#1D1F23",
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 8,
  },
  loginButtonTextDisabled: {
    color: "#5B6068",
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: {
    color: "#71767B",
    fontSize: 13,
    marginLeft: 7,
  },
  signupPrompt: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 4,
  },
  signupPromptText: {
    color: "#71767B",
    fontSize: 14,
    fontWeight: "500",
  },
  signupLinkText: {
    color: "#E7E9EA",
    fontWeight: "700",
  },
  serverConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6
  },
  serverConfigText: {
    color: '#71767B',
    fontSize: 13,
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#101114',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2F3336',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  modalTitle: {
    color: '#E7E9EA',
    fontSize: 22,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#71767B',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginTop: -4,
    marginBottom: 16,
    marginLeft: 4,
  }
});
