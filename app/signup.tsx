import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { register, saveAuth } from "../services/api";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import {
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Eye,
  EyeOff,
} from "lucide-react-native";

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "name" | "email" | "password" | "confirmPassword" | null
  >(null);

  const emailIsValid = email.trim().includes("@") && email.trim().includes(".");
  const passwordsMatch = password === confirmPassword;
  const passwordIsValid = password.length >= 6;
  const nameIsValid = name.trim().length > 0;

  const [isLoading, setIsLoading] = useState(false);

  const canSignup =
    nameIsValid && emailIsValid && passwordIsValid && passwordsMatch && !isLoading;

  const handleSignup = async () => {
    if (canSignup) {
      setIsLoading(true);
      try {
        const result = await register(name, email, password);
        await saveAuth({ user_id: result.user_id, username: result.username });
        router.replace("/chat");
      } catch (error: any) {
        alert(error?.response?.data?.detail || "Failed to create account");
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
        <View style={styles.shell}>
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
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>
                Sign up to start your intelligent legal workspace.
              </Text>
            </View>

            <Animated.View
              entering={FadeInUp.delay(120).duration(500)}
              style={styles.form}
            >
              {/* Name Field */}
              <View
                style={[
                  styles.inputGroup,
                  focusedField === "name" && styles.inputGroupFocused,
                ]}
              >
                <User
                  color={focusedField === "name" ? "#E7E9EA" : "#71767B"}
                  size={19}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#71767B"
                  autoCapitalize="words"
                  autoComplete="name"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Email Field */}
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
                  placeholder="Email address"
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

              {/* Password Field */}
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
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor="#71767B"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4, marginLeft: 8 }}
                >
                  {showPassword ? (
                    <EyeOff color="#71767B" size={19} />
                  ) : (
                    <Eye color="#71767B" size={19} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Confirm Password Field */}
              <View
                style={[
                  styles.inputGroup,
                  focusedField === "confirmPassword" && styles.inputGroupFocused,
                ]}
              >
                <Lock
                  color={focusedField === "confirmPassword" ? "#E7E9EA" : "#71767B"}
                  size={19}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#71767B"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ padding: 4, marginLeft: 8 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff color="#71767B" size={19} />
                  ) : (
                    <Eye color="#71767B" size={19} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Password Matching Verification Text */}
              {confirmPassword.length > 0 && !passwordsMatch && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.signupButton,
                  !canSignup && styles.signupButtonDisabled,
                ]}
                onPress={handleSignup}
                disabled={!canSignup}
                activeOpacity={0.82}
              >
                <Text
                  style={[
                    styles.signupButtonText,
                    !canSignup && styles.signupButtonTextDisabled,
                  ]}
                >
                  {isLoading ? "Creating..." : "Create account"}
                </Text>
                <ArrowRight
                  color={canSignup ? "#000000" : "#5B6068"}
                  size={19}
                />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.signinPrompt}
              onPress={() => router.push("/auth")}
              activeOpacity={0.7}
            >
              <Text style={styles.signinPromptText}>
                Already have an account?{" "}
                <Text style={styles.signinLinkText}>Sign in</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <ShieldCheck size={15} color="#71767B" />
              <Text style={styles.footerText}>Protected workspace access</Text>
            </View>
          </Animated.View>
        </View>
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
    flex: 1,
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
    gap: 14,
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
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
    marginTop: -4,
  },
  signupButton: {
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
  signupButtonDisabled: {
    backgroundColor: "#1D1F23",
    shadowOpacity: 0,
  },
  signupButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 8,
  },
  signupButtonTextDisabled: {
    color: "#5B6068",
  },
  signinPrompt: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 4,
  },
  signinPromptText: {
    color: "#71767B",
    fontSize: 14,
    fontWeight: "500",
  },
  signinLinkText: {
    color: "#E7E9EA",
    fontWeight: "700",
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
});
