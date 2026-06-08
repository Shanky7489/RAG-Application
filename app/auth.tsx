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
              <View style={styles.brandMark}>
                <Sparkles size={18} color="#000000" />
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
    marginBottom: 44,
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
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0,
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
