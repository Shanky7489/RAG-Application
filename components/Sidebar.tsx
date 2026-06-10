import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, Pressable, Platform, Modal, PanResponder, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Plus, MessageSquare, Trash2, Edit3, Check, X, LogOut, Sparkles, LayoutDashboard, BookOpen, History, Search, PanelLeft, Sun, Moon, ChevronDown, Hexagon, ChevronLeft } from 'lucide-react-native';
import { Session, clearAuth } from '../services/api';
import { MODELS, MODEL_ICONS } from '../services/constants';
import { useRouter } from 'expo-router';
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

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.72;
const PANEL_WIDTH = 260;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (id: string, newTitle: string) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  isDesktop?: boolean;
  theme: any;
  onOpen?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  username?: string;
}

const SessionItem = ({ session, isSelected, isEditing, theme, editTitle, setEditTitle, handleSaveEdit, setEditingId, onSelectSession, onClose, isDesktop, handleStartEdit, onDeleteSession }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = isSelected || isHovered;

  return (
    <View
      style={[
        styles.sessionItemContainer,
        isActive && {
          backgroundColor: theme.isDark ? 'rgba(99,102,241,0.12)' : '#F1F5F9',
          borderRadius: 10,
        }
      ]}
      {...(Platform.OS === 'web' ? {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false)
      } : {})}
    >
      {isEditing ? (
        <View style={styles.editRow}>
          <TextInput
            style={[styles.editInput, {
              color: theme.isDark ? '#F1F5F9' : '#0F172A',
              backgroundColor: theme.isDark ? '#2A2A40' : '#F8FAFC',
              borderColor: theme.isDark ? '#3D3D5C' : '#CBD5E1',
              borderWidth: 1
            }]}
            value={editTitle}
            onChangeText={setEditTitle}
            autoFocus
          />
          <TouchableOpacity onPress={() => handleSaveEdit(session.id)} style={styles.editActionBtn}>
            <Check size={15} color="#4ADE80" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditingId(null)} style={styles.editActionBtn}>
            <X size={15} color="#F87171" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.sessionBtn}
            onPress={() => {
              onSelectSession(session.id);
              if (!isDesktop) onClose();
            }}
          >
            <MessageSquare
              size={16}
              color={isActive
                ? (theme.isDark ? '#818CF8' : '#6366F1')
                : (theme.isDark ? '#4B5563' : '#94A3B8')}
              style={styles.sessionIcon}
            />
            <Text
              style={[
                styles.sessionText,
                { color: theme.isDark ? '#E2E8F0' : '#64748B' },
                isActive && { color: theme.isDark ? '#FFFFFF' : '#1E293B', fontWeight: '600' }
              ]}
              numberOfLines={1}
            >
              {session.title}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => handleStartEdit(session)} style={styles.actionBtn}>
              <Edit3 size={18} color={theme.isDark ? '#E2E8F0' : '#64748B'} style={{ opacity: 1 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteSession(session.id)} style={styles.actionBtn}>
              <Trash2 size={18} color="#EF4444" style={{ opacity: 1 }} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default function Sidebar({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  isDesktop = false,
  theme,
  onOpen,
  isDark,
  onToggleTheme,
  selectedModel,
  onSelectModel,
  username,
}: SidebarProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeNav, setActiveNav] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');

  const models = MODELS;
  const modelIcons = MODEL_ICONS;

  const currentModelInfo = models.find((m) => m.id === selectedModel) || models[0];

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Activate if horizontal movement is greater than vertical movement and > 10px
        return !isDesktop && Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If swiped from right to left (negative dx) by at least 40px, close sidebar
        if (gestureState.dx < -40) {
          onClose();
        }
      },
    })
  ).current;



  // Hide scrollbar on web for all containers to ensure a premium native app feel
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `;
      document.head.append(style);
      return () => style.remove();
    }
  }, []);

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const desktopWidth = useSharedValue(260);
  const COLLAPSED_WIDTH = 68;
  const EXPANDED_WIDTH = 260;

  React.useEffect(() => {
    if (isDesktop) {
      desktopWidth.value = withTiming(isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH, { duration: 250 });
      translateX.value = withTiming(0, { duration: 250 });
    } else {
      translateX.value = withTiming(isOpen ? 0 : -SIDEBAR_WIDTH, { duration: 250 });
      desktopWidth.value = withTiming(EXPANDED_WIDTH, { duration: 250 });
    }
  }, [isOpen, isDesktop]);

  const animatedStyle = useAnimatedStyle(() => {
    if (isDesktop) {
      return {
        width: desktopWidth.value,
      };
    }
    return {
      transform: [{ translateX: translateX.value }],
      width: SIDEBAR_WIDTH,
    };
  });

  const isCollapsed = isDesktop && !isOpen;

  const handleStartEdit = (session: Session) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim()) {
      await onRenameSession(id, editTitle.trim());
      setEditingId(null);
    }
  };

  // Sessions are already sorted newest-first from backend
  // No fake date grouping needed

  const handleLogout = async () => {
    await clearAuth();
    onClose();
    router.replace('/auth');
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'chat', icon: MessageSquare, label: 'My Cases' },
    { id: 'library', icon: BookOpen, label: 'Library' },
    { id: 'history', icon: History, label: 'History' },
  ];

  const iconNavBg = theme.sidebarBg;
  const panelBg = theme.sidebarBg;
  const panelBorder = theme.isDark ? '#0A0A0A' : '#E8EDF2';
  const navIconActive = '#FFFFFF';
  const navIconInactive = '#94A3B8';
  const navBgActive = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)';

  return (
    <>
      {isOpen && !isDesktop && (
        <Pressable style={styles.backdrop} onPress={onClose} />
      )}


      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.container,
          isDesktop ? styles.desktopContainer : null,
          animatedStyle
        ]}
      >
        {/* Sessions Panel */}
        <View style={[
          styles.panel,
          { backgroundColor: theme.sidebarBg },
          isCollapsed && { paddingHorizontal: 8 }
        ]}>
          {/* Panel Header */}
          <View style={[
            styles.panelHeader,
            isCollapsed && { justifyContent: 'center', paddingHorizontal: 0, paddingBottom: 0, borderBottomWidth: 0 },
            !isDesktop && { justifyContent: 'space-between' },
            !isCollapsed && {
              borderBottomWidth: 1,
              borderBottomColor: theme.isDark ? '#151515' : '#E5E5E5',
              paddingBottom: 16,
              marginBottom: 16
            }
          ]}>
            {/* Logo Section */}
            {!isCollapsed && (
              <View style={[styles.logoWrapper, { flex: 1 }]}>
                {!isDesktop && (
                  <TouchableOpacity
                    style={{ padding: 4, marginRight: 8 }}
                    onPress={onClose}
                  >
                    <ChevronLeft size={24} color={theme.text} />
                  </TouchableOpacity>
                )}
                <View style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <View style={{ marginRight: 8 }}>
                      <SvgXml xml={LEXAI_SVG(theme.text)} width="26" height="26" />
                    </View>
                    <Text style={[styles.brandNameTop, { fontSize: width < 380 ? 22 : 26, color: theme.text, lineHeight: width < 380 ? 26 : 28 }]}>LexAI</Text>
                  </View>
                  <Text style={{ fontSize: width < 380 ? 13 : 15, color: theme.textMuted, fontWeight: '800' }}>Powered by C-Net Infotech</Text>
                </View>
              </View>
            )}

            {isDesktop && (
              <TouchableOpacity
                style={[
                  styles.logoIcon,
                  { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? '#0A0A0A' : '#F1F5F9' },
                  !isCollapsed && { marginRight: 8, alignSelf: 'flex-start', marginTop: -8 }
                ]}
                onPress={() => {
                  if (isOpen) {
                    onClose();
                  } else {
                    onOpen && onOpen();
                  }
                }}
                activeOpacity={0.7}
              >
                <PanelLeft size={20} color={theme.isDark ? '#71767B' : '#475569'} />
              </TouchableOpacity>
            )}


          </View>
          {/* New Chat Button */}
          <TouchableOpacity
            style={[
              styles.newChatBtn,
              { backgroundColor: theme.buttonBg },
              isCollapsed && { width: 40, height: 40, borderRadius: 20, paddingHorizontal: 0, alignSelf: 'center', marginLeft: 0 }
            ]}
            onPress={() => { onCreateSession(); if (!isDesktop) onClose(); }}
          >
            <Plus size={16} color={theme.isDark ? '#000000' : '#FFFFFF'} />
            {!isCollapsed && <Text style={[styles.newChatBtnText, { color: theme.isDark ? '#000000' : '#FFFFFF' }]}> New Chat</Text>}
          </TouchableOpacity>

          {/* Removed MSME Form Mode Toggle Button */}



          {/* Search Bar */}
          {!isCollapsed ? (
            <View style={[styles.searchContainer, { backgroundColor: theme.isDark ? '#0A0A0A' : '#F1F5F9' }]}>
              <Search size={14} color={theme.isDark ? '#94A3B8' : '#94A3B8'} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search chats..."
                placeholderTextColor={theme.isDark ? '#94A3B8' : '#A0AEC0'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color={theme.isDark ? '#71767B' : '#64748B'} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.collapsedSearchBtn, { backgroundColor: theme.isDark ? '#0A0A0A' : '#F1F5F9' }]}
              onPress={() => onOpen && onOpen()}
            >
              <Search size={16} color={theme.isDark ? '#71767B' : '#64748B'} />
            </TouchableOpacity>
          )}



          {/* Section Label */}
          {!isCollapsed && (
            <Text style={[styles.sectionTitle, { color: theme.isDark ? '#64748B' : '#94A3B8' }]}>
              History / Conversations
            </Text>
          )}

          {/* Sessions List */}
          <ScrollView
            style={styles.sessionList}
            contentContainerStyle={{ paddingBottom: 20, alignItems: isCollapsed ? 'center' : 'stretch' }}
            showsVerticalScrollIndicator={false}
          >
            {isCollapsed ? (
              sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map((session) => {
                const isSelected = session.id === currentSessionId;
                return (
                  <View
                    key={session.id}
                    style={[
                      styles.sessionItemContainer,
                      isSelected && {
                        backgroundColor: theme.isDark ? 'rgba(99,102,241,0.12)' : '#F1F5F9',
                        borderRadius: 10,
                      },
                      { alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 0, width: 40, height: 40, borderRadius: 10 }
                    ]}
                  >
                    <TouchableOpacity
                      style={[styles.sessionBtn, { justifyContent: 'center', alignItems: 'center', paddingVertical: 0 }]}
                      onPress={() => {
                        onSelectSession(session.id);
                        if (!isDesktop) onClose();
                      }}
                    >
                      <MessageSquare
                        size={16}
                        color={isSelected
                          ? (theme.isDark ? '#818CF8' : '#6366F1')
                          : (theme.isDark ? '#4B5563' : '#94A3B8')}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <>
                {(() => {
                  const filtered = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
                  const renderItem = (session: Session) => {
                    const isSelected = session.id === currentSessionId;
                    const isEditing = session.id === editingId;

                    return (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isSelected={isSelected}
                        isEditing={isEditing}
                        theme={theme}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        handleSaveEdit={handleSaveEdit}
                        setEditingId={setEditingId}
                        onSelectSession={onSelectSession}
                        onClose={onClose}
                        isDesktop={isDesktop}
                        handleStartEdit={handleStartEdit}
                        onDeleteSession={onDeleteSession}
                      />
                    );
                  };

                  return (
                    <>
                      {filtered.map(renderItem)}
                      {filtered.length === 0 && (
                        <Text style={{ textAlign: 'center', color: theme.textMuted, fontSize: 13, marginTop: 20 }}>
                          No chats found
                        </Text>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View
              style={[
                styles.userProfile,
                { marginBottom: 0 },
                isCollapsed && { paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center', width: 40, height: 40, alignSelf: 'center' },
                !isCollapsed && { flexDirection: 'row', alignItems: 'center', justifyContent: isDesktop ? 'space-between' : 'flex-start', padding: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: isDesktop ? 1 : 0, flexShrink: 1, marginRight: isDesktop ? 8 : 16 }}>
                <View style={[
                  styles.footerAvatar,
                  { backgroundColor: theme.isDark ? '#CCCCCC' : '#0F172A' },
                  isCollapsed && { marginRight: 0 }
                ]}>
                  <Text style={[styles.footerAvatarText, { color: theme.isDark ? '#000000' : '#FFFFFF' }]}>
                    {username ? username.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                {!isCollapsed && (
                  <View style={styles.userInfo}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.userName, { color: theme.text, fontWeight: '600' }]}>{username || 'User'}</Text>
                  </View>
                )}
              </View>

              {!isCollapsed && (
                <TouchableOpacity onPress={handleLogout} style={{ padding: 8 }}>
                  <LogOut size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 99,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    flexDirection: 'row',
    zIndex: 100,
  },
  desktopContainer: {
    position: 'relative',
    width: PANEL_WIDTH,
    height: '100%',
    zIndex: 1,
    flexDirection: 'row',
  },
  logoIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 14,
    zIndex: 1,
    ...Platform.select({
      web: {
        boxShadow: '4px 0 24px rgba(255, 255, 255, 0.06)',
      } as any,
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
        shadowColor: '#FFFFFF',
      },
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 6,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  newChatBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
    paddingLeft: 4,
  },
  sessionList: {
    flex: 1,
  },
  sessionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  sessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
  },
  sessionIcon: {
    marginRight: 10,
  },
  sessionText: {
    fontSize: 17,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  editInput: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 15,
    marginRight: 6,
  },
  editActionBtn: {
    padding: 5,
  },
  footer: {
    paddingVertical: 14,
    marginBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  footerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  footerAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  userRole: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  logoutBtnText: {
    color: '#F87171',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  themeBtn: {
    alignSelf: 'stretch',
  },
  themeBtnText: {
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 8,
  },
  themeIconBtnTop: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMarkTop: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
      } as any,
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  brandNameTop: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    padding: 0,
    height: 36,
  },
  collapsedSearchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  categoryHeader: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 6,
    paddingLeft: 8,
  },
  modelSelectorSidebarBtn: {
    width: '100%',
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
  msmeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  msmeBtnText: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});
