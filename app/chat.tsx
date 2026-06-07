import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, useWindowDimensions, Modal, Image, Linking } from 'react-native';
import { Menu, Plus, UploadCloud, Sun, Moon, X, ChevronDown, Check, Database, FileText, Sparkles } from 'lucide-react-native';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import MessageBubble from '../components/MessageBubble';
import { useRouter } from 'expo-router';
import InputArea from '../components/InputArea';
import PdfPreview from '../components/PdfPreview';
import { MODELS, MODEL_ICONS } from '../services/constants';
import {
  getSessions,
  getSessionHistory,
  renameSession,
  deleteSession,
  uploadDocument,
  getQueryTrace,
  loadAuth,
  clearAuth,
  Session,
  ChatMessage,
  AuthData,
  API_BASE_URL
} from '../services/api';

const generateSessionId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

interface ThemeColors {
  isDark: boolean;
  background: string;
  sidebarBg: string;
  headerBg: string;
  border: string;
  text: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  bubbleUser: string;
  bubbleUserText: string;
  bubbleAi: string;
  bubbleAiText: string;
  buttonBg: string;
  buttonText: string;
}

const darkTheme: ThemeColors = {
  isDark: true,
  background: '#212121',
  sidebarBg: '#171717',
  headerBg: '#212121',
  border: '#303030',
  text: '#ECECEC',
  textMuted: '#B4B4B4',
  inputBg: '#2F2F2F',
  inputBorder: '#424242',
  bubbleUser: '#2F2F2F',
  bubbleUserText: '#ECECEC',
  bubbleAi: 'transparent',
  bubbleAiText: '#ECECEC',
  buttonBg: '#ECECEC',
  buttonText: '#171717',
};

const lightTheme: ThemeColors = {
  isDark: false,
  background: '#FFFFFF',
  sidebarBg: '#F9F9F9',
  headerBg: '#FFFFFF',
  border: '#E5E5E5',
  text: '#0D0D0D',
  textMuted: '#6B6B6B',
  inputBg: '#F4F4F4',
  inputBorder: '#E5E5E5',
  bubbleUser: '#F4F4F4',
  bubbleUserText: '#0D0D0D',
  bubbleAi: '#FFFFFF',
  bubbleAiText: '#0D0D0D',
  buttonBg: '#0D0D0D',
  buttonText: '#FFFFFF',
};

export default function ChatScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => setIsDark(prev => !prev);

  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("version1");
  const [appMode, setAppMode] = useState<"CMS" | "RAG">("RAG");
  const [ragSessionId, setRagSessionId] = useState<string | null>(null);
  const [cmsSessionId, setCmsSessionId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isMsmeMode = appMode === "CMS" || selectedModel === "msme";
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [queryTrace, setQueryTrace] = useState<any>(null);
  const [authData, setAuthData] = useState<AuthData | null>(null);

  // Load authenticated user on mount
  useEffect(() => {
    loadAuth().then(data => {
      if (data) {
        setAuthData(data);
      } else {
        router.replace("/auth");
      }
    });
  }, []);

  const fetchQueryTrace = async () => {
    try {
      const traceData = await getQueryTrace(selectedModel);
      setQueryTrace(traceData);
    } catch (e) {
      console.error("Failed to fetch query trace", e);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      const data = await response.json();
      setDbStats(data);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  useEffect(() => {
    if (rightSidebarOpen) {
      loadStats();
    }
  }, [rightSidebarOpen, selectedModel]);

  const models = MODELS;
  const modelIcons = MODEL_ICONS;

  const currentModelInfo = models.find((m) => m.id === selectedModel) || models[0];

  const handlePreviewFile = (file: any) => {
    if (file.type === 'image' || file.uri.startsWith('data:image/')) {
      setPreviewImageUri(file.uri);
    } else {
      // PDF or Document
      if (Platform.OS === 'web') {
        if (file.uri.startsWith('data:application/pdf;base64,')) {
          try {
            const parts = file.uri.split(';base64,');
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);
            for (let i = 0; i < rawLength; ++i) {
              uInt8Array[i] = raw.charCodeAt(i);
            }
            const blob = new Blob([uInt8Array], { type: contentType });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          } catch (e) {
            window.open(file.uri, '_blank');
          }
        } else {
          window.open(file.uri, '_blank');
        }
      } else {
        // Mobile
        Linking.openURL(file.uri).catch(err => Alert.alert("Error", "Cannot open document link"));
      }
    }
  };

  const handlePreviewSource = (sourceName: string) => {
    const documentUrl = `${API_BASE_URL}/static/${encodeURIComponent(sourceName)}`;
    const ext = sourceName.split('.').pop()?.toLowerCase();
    const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');

    if (isImg) {
      setPreviewImageUri(documentUrl);
    } else {
      if (Platform.OS === 'web') {
        window.open(documentUrl, '_blank');
      } else {
        Linking.openURL(documentUrl).catch(err => Alert.alert("Error", "Cannot open document link"));
      }
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch all sessions when authData is ready
  useEffect(() => {
    if (authData) {
      loadSessions();
    }
  }, [authData]);

  const loadSessions = async () => {
    try {
      const userId = authData?.user_id || 'default_user';
      const data = await getSessions(userId);
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        // Load the most recent session by default (backend returns newest first)
        handleSelectSession(data[0].id);
      } else if (!currentSessionId) {
        // Start a fresh session
        handleCreateSession();
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      // Fallback: Initialize a new session ID so the UI is ready to chat immediately
      if (!currentSessionId) {
        handleCreateSession();
      }
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setLoadingHistory(true);
    try {
      const history = await getSessionHistory(sessionId);
      setMessages(history.messages);
    } catch (error) {
      console.error("Error fetching session history:", error);
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateSession = () => {
    const newId = generateSessionId();
    setCurrentSessionId(newId);
    setMessages([]);
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
    try {
      await renameSession(id, newTitle);
      loadSessions();
    } catch (error) {
      Alert.alert("Error", "Could not rename session");
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      loadSessions();
    } catch (error) {
      Alert.alert("Error", "Could not delete session");
    }
  };

  const handleFileUpload = async (uri: string, name: string, mimeType: string) => {
    try {
      const res = await uploadDocument(uri, name, mimeType);
      if (res.status === 'success') {
        Alert.alert("Success", "Document processed and ingested successfully!");
      } else if (res.status === 'already_exists') {
        Alert.alert("Notice", "Document already exists in system database.");
      }
      return res;
    } catch (error) {
      Alert.alert("Upload Failed", "Failed to upload document. Make sure server is running.");
      throw error;
    }
  };

  const handleSendMessage = async (text: string, files?: any[], buildGraph: boolean = false, updateStatus?: (id: string, status: string) => void) => {
    if (!currentSessionId) return false;

    setIsSending(true);

    // 1. Upload files first if there are any attached
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          console.log(`Ingesting file sequentially: ${file.name}`);
          if (updateStatus) updateStatus(file.id, 'uploading');
          const res = await uploadDocument(file.uri, file.name, file.mimeType, buildGraph);
          if (res && res.status === 'already_exists') {
            if (updateStatus) updateStatus(file.id, 'already_exists');
          } else {
            if (updateStatus) updateStatus(file.id, 'success');
          }
        } catch (error) {
          console.error("File ingestion failed:", error);
          if (updateStatus) updateStatus(file.id, 'failed');
          Alert.alert("Upload Failed", `Failed to upload document "${file.name}". Make sure server is running.`);
          setIsSending(false);
          return false; // Stop the chat send process
        }
      }
      // Add a small delay so user can see "Finished"
      await new Promise(res => setTimeout(res, 800));
    }

    // If the user didn't type any text, just ingested files, stop here!
    if (!text || text.trim() === "") {
      setIsSending(false);
      // Refresh database stats in the RightSidebar to show the new document
      loadStats();
      return true;
    }

    // 2. Add User Message to UI
    const userMsg: ChatMessage = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);

    // 3. Add empty assistant response to stream into
    const assistantMsg: ChatMessage = { role: 'assistant', text: '' };
    setMessages(prev => [...prev, assistantMsg]);

    // Scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // 4. Use XMLHttpRequest for robust POST SSE Streaming in React Native
    const xhr = new XMLHttpRequest();
    const chatEndpoint = isMsmeMode ? `${API_BASE_URL}/chat/msme` : `${API_BASE_URL}/chat/stream`;
    xhr.open('POST', chatEndpoint);
    xhr.setRequestHeader('Content-Type', 'application/json');

    let processedLength = 0;

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        const responseText = xhr.responseText;
        const newText = responseText.substring(processedLength);
        const blocks = newText.split('\n\n');
        const completeBlocks = xhr.readyState === 3 ? blocks.slice(0, -1) : blocks;

        let consumedLength = 0;
        for (let i = 0; i < completeBlocks.length; i++) {
          consumedLength += completeBlocks[i].length + 2; // block length + '\n\n'
          const block = completeBlocks[i].trim();
          if (!block) continue;

          const lines = block.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim();
              try {
                const data = JSON.parse(dataStr);
                if (data.token) {
                  // Update last message token by token (immutable update)
                  setMessages(prev => {
                    const next = [...prev];
                    if (next.length > 0) {
                      const last = next[next.length - 1];
                      if (last.role === 'assistant') {
                        next[next.length - 1] = { ...last, text: last.text + data.token };
                      }
                    }
                    return next;
                  });
                  setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 50);
                }

                if (data.done) {
                  setIsSending(false);
                  loadSessions(); // Reload sessions in case session title was generated/saved
                  fetchQueryTrace(); // Fetch the query stats lifecycle trace
                }

                if (data.error) {
                  Alert.alert("Streaming Error", data.error);
                  setIsSending(false);
                }
              } catch (e) {
                // partial chunk or parse error
              }
            }
          }
        }
        processedLength += consumedLength;
      }

      if (xhr.readyState === 4) {
        setIsSending(false);
      }
    };

    xhr.onerror = () => {
      Alert.alert("Network Error", "Failed to connect to chat API.");
      setIsSending(false);
    };

    xhr.send(JSON.stringify({
      session_id: currentSessionId,
      query: text.trim(),
      model: selectedModel,
      user_id: authData?.user_id || 'default_user'
    }));

    return true;
  };

  const handleModeSwitch = (mode: "RAG" | "CMS") => {
    if (appMode === mode) {
      setIsDropdownOpen(false);
      return;
    }
    
    if (appMode === "RAG") {
      setRagSessionId(currentSessionId);
    } else {
      setCmsSessionId(currentSessionId);
    }
    
    setAppMode(mode);
    setIsDropdownOpen(false);
    
    const targetSessionId = mode === "RAG" ? ragSessionId : cmsSessionId;
    if (targetSessionId) {
      handleSelectSession(targetSessionId);
    } else {
      handleCreateSession();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Mode Selection Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: theme.isDark ? "#16181C" : "#FFFFFF",
                borderColor: theme.isDark ? "#2F3336" : "#E2E8F0",
              },
            ]}
          >
            <Text
              style={[
                styles.dropdownTitle,
                { color: theme.isDark ? "#71767B" : "#718096" },
              ]}
            >
              Select Mode
            </Text>
            {["RAG", "CMS"].map((mode) => {
              const isSelected = appMode === mode;
              const IconComponent = mode === "RAG" ? Sparkles : FileText;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.dropdownItem,
                    isSelected && {
                      backgroundColor: theme.isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                    },
                  ]}
                  onPress={() => {
                    handleModeSwitch(mode as "RAG" | "CMS");
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
                      {mode}
                    </Text>
                    <Text
                      style={[
                        styles.modelDescText,
                        { color: theme.isDark ? "#71767B" : "#718096" },
                      ]}
                    >
                      {mode === "RAG" ? "Chat with your data" : "Content Management"}
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.mainLayout, isDesktop && styles.rowLayout, { backgroundColor: theme.background }]}>
          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onOpen={() => setSidebarOpen(true)}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            onRenameSession={handleRenameSession}
            onDeleteSession={handleDeleteSession}
            isDesktop={isDesktop}
            theme={theme}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            username={authData?.username}
          />

          {/* Chat Container */}
          <View style={[styles.chatContainer, { backgroundColor: theme.background }]}>
            {/* Header (Desktop: always visible, Mobile: only when sidebar closed) */}
            {(isDesktop || (!isDesktop && !sidebarOpen)) && (
              <View style={[
                styles.header,
                {
                  backgroundColor: theme.headerBg,
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  alignItems: 'center',
                }
              ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {!isDesktop && (
                    <TouchableOpacity
                      onPress={() => setSidebarOpen(true)}
                      style={[styles.headerIconBtn, { marginRight: 8 }]}
                    >
                      <Menu size={20} color={theme.isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.modelSelectorPillHeader,
                      {
                        backgroundColor: 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 6,
                        borderRadius: 10,
                      }
                    ]}
                    onPress={() => setIsDropdownOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginRight: 6 }}>
                      {appMode}
                    </Text>
                    <ChevronDown
                      size={16}
                      color={theme.isDark ? '#71767B' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[
                    styles.headerIconBtn,
                    { marginLeft: 8, backgroundColor: theme.isDark ? '#16181C' : '#F1F5F9' }
                  ]}
                  onPress={() => setRightSidebarOpen(true)}
                >
                  <Database size={20} color={theme.isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>
            )}

            {/* Chat Area & Input */}
            <View style={{ flex: 1, flexDirection: 'column' }}>
              {/* Chat Area */}
              <View style={[styles.chatArea, { backgroundColor: theme.background }]}>
                {appMode === 'CMS' && (
                  <View style={{ padding: 16, alignItems: 'center', zIndex: 10 }}>
                    <PdfPreview theme={theme} isDesktop={isDesktop} />
                  </View>
                )}
                
                {loadingHistory ? (
                    <View style={styles.centerContainer}>
                      <ActivityIndicator size="large" color={theme.isDark ? '#6366F1' : '#0F172A'} />
                      <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading history...</Text>
                    </View>
                  ) : messages.length === 0 ? (
                    <View style={styles.centerContainer}>
                      <View style={styles.emptyIconWrap}>
                        {isMsmeMode ? (
                          <FileText size={40} color={theme.isDark ? '#FFFFFF' : '#64748B'} />
                        ) : (
                          <UploadCloud size={40} color={theme.isDark ? '#FFFFFF' : '#64748B'} />
                        )}
                      </View>
                      <Text style={[styles.emptyText, { color: theme.text }]}>
                        {isMsmeMode ? "MSME Form Assistant" : "Chat with LexAI"}
                      </Text>
                      <Text style={[styles.emptySubText, { color: theme.textMuted }]}>
                        {isMsmeMode
                          ? "Describe your business details and LexAI will help you fill and format your MSME Registration form."
                          : "Powered by LexAI \n Upload documents to query them using advanced AI"}
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      ref={scrollViewRef}
                      style={styles.messagesContainer}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={[
                        { paddingVertical: 20, paddingHorizontal: isDesktop ? 20 : 10 },
                        isDesktop && { maxWidth: 820, width: '100%', alignSelf: 'center' }
                      ]}
                      onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    >
                      {messages.map((msg: any, index) => (
                        <MessageBubble
                          key={index}
                          role={msg.role}
                          text={msg.text}
                          source={msg.source}
                          page={msg.page}
                          isStreaming={isSending && index === messages.length - 1 && msg.role === 'assistant'}
                          theme={theme}
                          onPreviewSource={handlePreviewSource}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>

              {/* Input Area */}
              <InputArea
                onSendMessage={handleSendMessage}
                onPreviewFile={handlePreviewFile}
                isSending={isSending}
                theme={theme}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                appMode={appMode}
              />
            </View>
          </View>

          {/* Right Sidebar */}
          <RightSidebar
            isOpen={rightSidebarOpen}
            onClose={() => setRightSidebarOpen(false)}
            stats={dbStats}
            queryTrace={queryTrace}
            selectedModel={selectedModel}
            theme={theme}
            isDesktop={isDesktop}
            onRefreshStats={loadStats}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Preview Modal */}
      <Modal
        visible={previewImageUri !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            onPress={() => setPreviewImageUri(null)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            {previewImageUri && (
              <Image
                source={{ uri: previewImageUri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPreviewImageUri(null)}
            >
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Model Selection Dropdown Modal for Desktop Header (Removed to avoid duplication) */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  mainLayout: {
    flex: 1,
  },
  rowLayout: {
    flexDirection: 'row',
  },
  chatContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChatHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newChatHeaderText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 5,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerBanner: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chatArea: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 42,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: -45,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 8,
  },
  modelSelectorPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    maxWidth: 320,
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
