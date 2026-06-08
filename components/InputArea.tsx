import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
  Image,
  ScrollView,
  Modal,
  useWindowDimensions,
  NativeModules,
  Alert,
  Pressable,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Paperclip,
  Send,
  X,
  FileText,
  Image as ImageIcon,
  Mic,
  Check,
  Plus,
  Camera,
  ChevronDown,
  Square,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "../services/api";
import { MODELS, MODEL_ICONS } from "../services/constants";

interface InputAreaProps {
  onSendMessage: (message: string, files: AttachedFile[], buildGraph: boolean, updateStatus: (id: string, status: any) => void) => Promise<boolean>;
  onStopMessage?: () => void;
  isSending: boolean;
  theme: any;
  onPreviewFile?: (file: AttachedFile) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  appMode: "CMS" | "RAG";
}

interface AttachedFile {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  type: "image" | "document";
  status: "ready" | "uploading" | "success" | "already_exists" | "failed";
}

export interface InputAreaRef {
  pickDocument: () => void;
  takeImage: () => void;
}

const LANGUAGES = [
  { code: "en-US", name: "English", label: "EN" },
  { code: "te-IN", name: "తెలుగు", label: "TE" },
];

const InputArea = forwardRef<InputAreaRef, InputAreaProps>(({
  onSendMessage,
  onStopMessage,
  isSending,
  theme,
  onPreviewFile,
  selectedModel,
  setSelectedModel,
  appMode,
}, ref) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(40); // Initial height for 1 line
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [buildGraph, setBuildGraph] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [listeningText, setListeningText] = useState("");
  const [micLanguage, setMicLanguage] = useState("en-US");
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [nativeVoiceSupport, setNativeVoiceSupport] = useState(true);
  const [waveHeights, setWaveHeights] = useState([12, 18, 10, 24, 15, 20, 12]);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const webRecognitionRef = useRef<any>(null);
  const isMsmeMode = appMode === "CMS" || selectedModel === "msme";

  useImperativeHandle(ref, () => ({
    pickDocument: handlePickDocument,
    takeImage: handleTakeImage
  }));

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Diagnostic logs
  useEffect(() => {
    console.log("[LexAI Voice Debug] ExpoSpeechRecognition API loaded");
  }, []);

  // Web speech recognition effect
  useEffect(() => {
    if (Platform.OS === "web") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (webRecognitionRef.current) {
          try {
            webRecognitionRef.current.stop();
          } catch (e) { }
        }
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = micLanguage;

        rec.onstart = () => {
          setIsListening(true);
          setListeningText("");
        };

        rec.onresult = (event: any) => {
          let currentInterim = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setText((prev) => prev + (prev && !prev.endsWith(" ") ? " " : "") + finalTranscript);
          }
          setInterimText(currentInterim);
        };

        rec.onerror = (event: any) => {
          console.error("Web Speech error", event.error);
          setIsListening(false);
          setInterimText("");
        };

        rec.onend = () => {
          setIsListening(false);
          setInterimText("");
        };

        webRecognitionRef.current = rec;
      }
    }
  }, [micLanguage]);

  // Mobile Speech Recognition events removed for Expo Go compatibility

  const handleLanguageToggle = (langCode: string) => {
    setMicLanguage(langCode);
    if (isListening) {
      if (Platform.OS === "web" && webRecognitionRef.current) {
        try { webRecognitionRef.current.stop(); } catch (e) { }
        setTimeout(() => {
          if (webRecognitionRef.current) {
            webRecognitionRef.current.lang = langCode;
            try { webRecognitionRef.current.start(); } catch (e) { console.log(e); }
          }
        }, 300);
      }
    }
  };

  const toggleVoiceTyping = async () => {
    if (isListening) {
      // STOP
      if (Platform.OS === "web") {
        webRecognitionRef.current?.stop();
      }
      setIsListening(false);
      if (interimText) {
        setText((prev) => prev + (prev && !prev.endsWith(" ") ? " " : "") + interimText);
        setInterimText("");
      }
    } else {
      // START
      setInterimText("");
      if (Platform.OS === "web") {
        if (webRecognitionRef.current) {
          try {
            webRecognitionRef.current.start();
          } catch (e) {
            console.log(e);
          }
        } else {
          alert("Speech Recognition not supported on this browser.");
        }
      } else {
        Alert.alert(
          "Feature Unavailable",
          "Voice typing is not available in the Expo Go app. To use this feature, the app must be built with custom native code."
        );
      }
    }
  };

  // Inject Web-specific CSS to hide scrollbar tracks on browser textareas
  useEffect(() => {
    if (Platform.OS === "web") {
      const style = document.createElement("style");
      style.textContent = `
        textarea {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        textarea::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `;
      document.head.append(style);
      return () => style.remove();
    }
  }, []);

  const handleSend = async () => {
    if ((text.trim() || files.length > 0) && !isSending) {
      const currentFiles = [...files];
      const updateStatus = (id: string, status: any) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status } : f));
      };

      const success = await onSendMessage(text.trim(), currentFiles, buildGraph, updateStatus);
      if (success) {
        setText("");
        setInputHeight(40);
        setFiles([]);
      }
    }
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS === "web") {
      if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleContentSizeChange = (e: any) => {
    const height = e.nativeEvent.contentSize.height;
    if (height > 0) {
      setInputHeight(Math.min(120, Math.max(40, height)));
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handlePickDocument = async () => {
    setIsAttachmentMenuOpen(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/*",
        ],
        copyToCacheDirectory: true,
        multiple: true,
      });

      let asset: { uri: string; name: string; mimeType?: string } | null = null;
      const pickerResult = result as any;

      if (pickerResult.type === "success") {
        let mime = "";
        if (pickerResult.uri.startsWith("data:")) {
          const match = pickerResult.uri.match(/^data:([^;]+);/);
          if (match) mime = match[1];
        }
        asset = {
          uri: pickerResult.uri,
          name: pickerResult.name,
          mimeType: mime || "application/octet-stream",
        };
      }
      else if (
        !pickerResult.canceled &&
        pickerResult.assets &&
        pickerResult.assets.length > 0
      ) {
        const newFiles = pickerResult.assets.map((a: any) => {
          const fileId = Math.random().toString(36).substring(7);
          const fileType = a.mimeType?.startsWith("image/") ? "image" : "document";
          return {
            id: fileId,
            name: a.name,
            uri: a.uri,
            mimeType: a.mimeType || "application/octet-stream",
            type: fileType,
            status: "ready",
          };
        });
        setFiles((prev) => [...prev, ...newFiles]);
        return;
      }

      if (asset) {
        const fileId = Math.random().toString(36).substring(7);
        const fileType = asset.mimeType?.startsWith("image/")
          ? "image"
          : "document";

        const newFile: AttachedFile = {
          id: fileId,
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType || "application/octet-stream",
          type: fileType,
          status: "ready",
        };

        setFiles((prev) => [...prev, newFile]);
      }
    } catch (err) {
      console.log("Error picking document", err);
    }
  };

  const handlePickImage = async () => {
    setIsAttachmentMenuOpen(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        multiple: true,
      });

      let asset: { uri: string; name: string; mimeType?: string } | null = null;
      const pickerResult = result as any;

      if (pickerResult.type === "success") {
        let mime = "";
        if (pickerResult.uri.startsWith("data:")) {
          const match = pickerResult.uri.match(/^data:([^;]+);/);
          if (match) mime = match[1];
        }
        asset = {
          uri: pickerResult.uri,
          name: pickerResult.name,
          mimeType: mime || "image/jpeg",
        };
      } else if (
        !pickerResult.canceled &&
        pickerResult.assets &&
        pickerResult.assets.length > 0
      ) {
        const newFiles = pickerResult.assets.map((a: any) => {
          const fileId = Math.random().toString(36).substring(7);
          return {
            id: fileId,
            name: a.name,
            uri: a.uri,
            mimeType: a.mimeType || "image/jpeg",
            type: "image",
            status: "ready",
          };
        });
        setFiles((prev) => [...prev, ...newFiles]);
        return;
      }

      if (asset) {
        const fileId = Math.random().toString(36).substring(7);
        const newFile: AttachedFile = {
          id: fileId,
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType || "image/jpeg",
          type: "image",
          status: "ready",
        };
        setFiles((prev) => [...prev, newFile]);
      }
    } catch (err) {
      console.log("Error picking image", err);
    }
  };

  const handleTakeImage = async () => {
    setIsAttachmentMenuOpen(false);
    if (Platform.OS === 'web') {
      Alert.alert("Camera not supported", "Camera is not supported on web currently.");
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission required", "Sorry, we need camera permissions to make this work!");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileId = Math.random().toString(36).substring(7);
        const newFile: AttachedFile = {
          id: fileId,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          uri: asset.uri,
          mimeType: asset.mimeType || "image/jpeg",
          type: "image",
          status: "ready",
        };
        setFiles((prev) => [...prev, newFile]);
      }
    } catch (err) {
      console.log("Error taking photo", err);
      Alert.alert("Error", "Could not open camera. Make sure permissions are granted.");
    }
  };

  // Premium adaptive input styling
  const containerBg = theme.background;
  const inputBg = theme.inputBg;
  const inputBorderColor = isFocused ? theme.buttonBg : theme.border;
  const iconColor = theme.textMuted;
  const iconActiveColor = theme.isDark ? "#C5A880" : "#B89565";
  const sendBtnActive = theme.buttonBg;
  const sendBtnInactive = theme.isDark ? "#1A1D24" : "#EDF2F7";
  const inputTextColor = theme.text;
  const placeholderColor = theme.textMuted;
  const canSend = (text.trim() || files.length > 0) && !isSending;

  return (
    <View style={[styles.container, { backgroundColor: containerBg, paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 12, paddingHorizontal: width < 380 ? 12 : 20 }]}>
      {/* Horizontal Files Preview Row */}
      {files.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filesRow}
          contentContainerStyle={styles.filesRowContainer}
        >
          {files.map((file) => (
            <TouchableOpacity
              key={file.id}
              style={[
                styles.fileCard,
                {
                  backgroundColor: theme.isDark ? "#1E293B" : "#FFFFFF",
                  borderColor: theme.isDark ? "#334155" : "#E2E8F0",
                },
              ]}
              onPress={() => onPreviewFile && onPreviewFile(file)}
              activeOpacity={0.7}
            >
              {file.type === "image" && (file.status === "success" || file.status === "already_exists") ? (
                <Image
                  source={{ uri: file.uri }}
                  style={styles.imageThumbnail}
                />
              ) : (
                <View
                  style={[
                    styles.fileIconContainer,
                    { backgroundColor: theme.isDark ? "#1E3A5F" : "#EFF6FF" },
                  ]}
                >
                  {file.status === "uploading" ? (
                    <ActivityIndicator size="small" color="#6366F1" />
                  ) : file.type === "image" ? (
                    <ImageIcon size={16} color="#6366F1" />
                  ) : (
                    <FileText size={16} color="#6366F1" />
                  )}
                </View>
              )}

              <View style={styles.fileInfo}>
                <Text
                  style={[
                    styles.fileName,
                    { color: theme.isDark ? "#F1F5F9" : "#0F172A" },
                  ]}
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
                <Text
                  style={[
                    styles.fileStatus,
                    file.status === "ready" && {
                      color: theme.isDark ? "#38BDF8" : "#0284C7"
                    },
                    file.status === "uploading" && {
                      color: theme.isDark ? "#94A3B8" : "#64748B",
                    },
                    file.status === "success" && { color: "#22C55E" },
                    file.status === "already_exists" && { color: "#EAB308" },
                    file.status === "failed" && { color: "#EF4444" },
                  ]}
                >
                  {file.status === "uploading"
                    ? "Processing..."
                    : file.status === "success"
                      ? "Finished"
                      : file.status === "already_exists"
                        ? "Already Ingested"
                        : file.status === "failed"
                          ? "Failed"
                          : "Ready"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.removeFileBtn}
                onPress={() => handleRemoveFile(file.id)}
              >
                <X size={10} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Graph Mapping Toggle Row */}
      {files.length > 0 && selectedModel === "version1" && (
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleCheckbox, buildGraph && { backgroundColor: theme.buttonBg, borderColor: theme.buttonBg }]}
            onPress={() => setBuildGraph(!buildGraph)}
          >
            {buildGraph && <Text style={styles.toggleCheckmark}>✓</Text>}
          </TouchableOpacity>
          <Text style={[styles.toggleText, { color: theme.text }]}>
            Enable Graph Mapping (Rag 1)
          </Text>
        </View>
      )}

      {/* Attachment Menu Modal Overlay */}
      <Modal
        visible={isAttachmentMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAttachmentMenuOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "transparent" }}
          onPress={() => setIsAttachmentMenuOpen(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              paddingBottom: inputHeight + (Platform.OS === 'ios' ? 35 : 25),
              paddingLeft: width >= 768 ? 280 : 20,
            }}
          >
            <View
              style={[
                styles.attachmentMenu,
                {
                  backgroundColor: theme.isDark ? "#232323" : "#FFFFFF",
                  borderColor: theme.isDark ? "#3F3F3F" : "#E2E8F0",
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <TouchableOpacity style={styles.attachmentOption} onPress={handlePickDocument}>
                <FileText size={16} color={theme.isDark ? "#D1D5DB" : "#475569"} style={styles.attachmentIcon} />
                <Text style={[styles.attachmentOptionText, { color: theme.isDark ? "#E0E0E0" : "#1F2937" }]}>Add document</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentOption} onPress={handlePickImage}>
                <ImageIcon size={16} color={theme.isDark ? "#D1D5DB" : "#475569"} style={styles.attachmentIcon} />
                <Text style={[styles.attachmentOptionText, { color: theme.isDark ? "#E0E0E0" : "#1F2937" }]}>Add photos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentOption} onPress={handleTakeImage}>
                <Camera size={16} color={theme.isDark ? "#D1D5DB" : "#475569"} style={styles.attachmentIcon} />
                <Text style={[styles.attachmentOptionText, { color: theme.isDark ? "#E0E0E0" : "#1F2937" }]}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Model Selection Modal */}
      <Modal
        visible={isModelMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModelMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModelMenuOpen(false)}
        >
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: theme.isDark ? "#16181C" : "#FFFFFF",
                borderColor: theme.isDark ? "#2F3336" : "#E2E8F0",
                width: Math.min(width * 0.9, 300),
              },
            ]}
          >
            <Text
              style={[
                styles.dropdownTitle,
                { color: theme.isDark ? "#71767B" : "#718096" },
              ]}
            >
              Select Model
            </Text>
            {MODELS.filter(m => m.id === "version1" || m.id === "version2").map((model) => {
              const isSelected = selectedModel === model.id;
              const IconComponent = MODEL_ICONS[model.iconName];
              return (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.dropdownItem,
                    isSelected && {
                      backgroundColor: theme.isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                    },
                  ]}
                  onPress={() => {
                    setSelectedModel(model.id);
                    setIsModelMenuOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modelIconWrapper}>
                    <IconComponent
                      size={18}
                      color={
                        isSelected
                          ? theme.isDark
                            ? "#F1F5F9"
                            : "#0F172A"
                          : theme.isDark
                            ? "#71767B"
                            : "#94A3B8"
                      }
                    />
                  </View>
                  <View style={styles.modelDetails}>
                    <Text
                      style={[
                        styles.modelNameText,
                        { color: theme.isDark ? "#E7E9EA" : "#1A202C" },
                        isSelected && { fontWeight: "700" },
                      ]}
                    >
                      {model.name}
                    </Text>
                    <Text
                      style={[
                        styles.modelDescText,
                        { color: theme.isDark ? "#71767B" : "#718096" },
                      ]}
                    >
                      {model.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Check
                      size={16}
                      color={theme.isDark ? "#10B981" : "#059669"}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Input Container */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: inputBg,
            borderColor: inputBorderColor,
            ...Platform.select({
              web: isFocused
                ? ({
                  backgroundImage: theme.isDark
                    ? "linear-gradient(135deg, #2F2F2F 0%, #212121 100%)"
                    : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                  boxShadow: theme.isDark
                    ? "0 0 0 1px rgba(255, 255, 255, 0.1), 0 12px 36px rgba(0,0,0,0.3)"
                    : "0 0 0 3px rgba(30,41,59,0.08), 0 12px 30px rgba(30,41,59,0.06)",
                } as any)
                : ({
                  backgroundImage: theme.isDark
                    ? "linear-gradient(135deg, #11141A 0%, #0E1117 100%)"
                    : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                } as any),
            }),
          },
        ]}
      >
        {/* RAG Model Selector Pill */}
        {appMode === "RAG" && (
          <View style={{ flexDirection: 'row', paddingBottom: 6, alignSelf: 'flex-start' }}>
            <TouchableOpacity
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9",
                  borderWidth: 1,
                  borderColor: theme.isDark ? "#334155" : "#E2E8F0",
                }
              ]}
              onPress={() => setIsModelMenuOpen(true)}
              activeOpacity={0.7}
            >
              {(() => {
                const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];
                const IconComp = MODEL_ICONS[currentModel.iconName];
                return (
                  <>
                    <IconComp size={12} color={theme.isDark ? "#94A3B8" : "#64748B"} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text, marginRight: 4 }}>
                      {currentModel.name}
                    </Text>
                    <ChevronDown size={12} color={theme.isDark ? "#64748B" : "#94A3B8"} />
                  </>
                );
              })()}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', width: '100%' }}>
          {/* Attachment Menu Trigger */}
          {!isMsmeMode && (
            <TouchableOpacity
              style={[
                styles.plusButton,
                { borderColor: theme.isDark ? '#3F3F3F' : '#E2E8F0' }
              ]}
              onPress={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
              disabled={isSending}
            >
              <Plus
                size={16}
                color={theme.isDark ? '#D1D5DB' : '#64748B'}
              />
            </TouchableOpacity>
          )}

          {/* Text Input */}
          <TextInput
            style={[styles.input, { height: inputHeight, color: inputTextColor }]}
            placeholder="Ask your legal question..."
            placeholderTextColor={placeholderColor}
            multiline
            value={text + (interimText ? (text && !text.endsWith(' ') ? ' ' : '') + interimText : '')}
            onChangeText={(val) => {
              // If they type manually, clear interim and just update text
              if (interimText) setInterimText("");
              setText(val);
            }}
            editable={!isSending}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onContentSizeChange={handleContentSizeChange}
          />

          {/* Mic Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleVoiceTyping}
            disabled={isSending}
          >
            <Mic size={20} color={isListening ? "#EF4444" : (isFocused ? iconActiveColor : iconColor)} />
          </TouchableOpacity>

          {/* Send or Stop Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: isSending ? (theme.isDark ? "#2D3035" : "#E2E8F0") : (canSend ? sendBtnActive : sendBtnInactive) },
            ]}
            onPress={isSending ? onStopMessage : handleSend}
            disabled={!canSend && !isSending}
          >
            {isSending ? (
              <Square
                size={14}
                fill={theme.isDark ? "#FFFFFF" : "#0F172A"}
                color={theme.isDark ? "#FFFFFF" : "#0F172A"}
              />
            ) : (
              <Send
                size={17}
                color={
                  canSend
                    ? theme.isDark
                      ? "#000000"
                      : "#FFFFFF"
                    : theme.isDark
                      ? "#5B6068"
                      : "#CBD5E1"
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
  },
  attachmentModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  attachmentMenu: {
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    flexDirection: "column",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  attachmentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  attachmentIcon: {
    marginRight: 12,
  },
  attachmentOptionText: {
    fontSize: 13,
    fontWeight: "400",
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    marginLeft: 8,
    marginRight: 8,
  },
  filesRow: {
    marginBottom: 10,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  filesRowContainer: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    alignItems: "center",
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 8,
    marginRight: 8,
    width: 175,
    position: "relative",
    borderWidth: 1,
  },
  imageThumbnail: {
    width: 30,
    height: 30,
    borderRadius: 6,
    marginRight: 8,
  },
  fileIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 11,
    fontWeight: "600",
  },
  fileStatus: {
    fontSize: 10,
    marginTop: 2,
  },
  removeFileBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginLeft: 8,
  },
  toggleCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#71767B",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleCheckmark: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "column",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
    ...Platform.select({
      web: {
        transition: "all 0.2s ease",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      } as any,
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  iconButton: {
    padding: 9,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 7,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      } as any,
    }),
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  hintText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: Platform.OS === "web" ? "center" : "flex-end",
    alignItems: "center",
  },
  listenCard: {
    width: "100%",
    maxWidth: 600,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    ...Platform.select({
      web: {
        borderRadius: 24,
        marginBottom: 40,
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
      } as any,
    }),
  },
  listenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  langSelector: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 3,
  },
  langPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 17,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  listenBody: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    width: "100%",
  },
  listenStatusText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  waveformContainer: {
    flexDirection: "row",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 3,
  },
  pulseCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  micActiveBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  transcriptionBox: {
    width: "100%",
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  transcriptionScroll: {
    flexGrow: 1,
  },
  transcriptionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  listenFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
    marginRight: 12,
  },
  cancelBtnText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
  },
  doneBtn: {
    marginLeft: 12,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  unsupportedCard: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: "100%",
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  unsupportedTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  unsupportedDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  codeBlock: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 14,
    fontWeight: "600",
  },
  unsupportedTip: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    fontStyle: "italic",
  },
  errorBox: {
    width: "100%",
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownMenu: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  modelIconWrapper: {
    marginRight: 12,
  },
  modelDetails: {
    flex: 1,
  },
  modelNameText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  modelDescText: {
    fontSize: 11,
    lineHeight: 14,
  },
  checkIcon: {
    marginLeft: 8,
  },
});

export default InputArea;
