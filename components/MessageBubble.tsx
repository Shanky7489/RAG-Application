import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { FileText, Copy, Check } from 'lucide-react-native';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  source?: string;
  page?: string;
  isStreaming?: boolean;
  theme: any;
  onPreviewSource?: (sourceName: string) => void;
}

function renderMarkdown(text: string, theme: any, isUser: boolean) {
  const textColor = isUser ? theme.bubbleUserText : theme.bubbleAiText;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // If it's a code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3).trim().split('\n');
      let language = 'code';
      let codeContent = lines.join('\n');
      if (lines.length > 0 && lines[0].length < 15 && !lines[0].includes(' ') && lines[0] !== '') {
        language = lines[0];
        codeContent = lines.slice(1).join('\n');
      }

      return (
        <View key={index} style={[styles.codeBlock, { backgroundColor: theme.isDark ? '#0D0D11' : '#F9FAFB', borderColor: theme.border }]}>
          <View style={[styles.codeHeader, { borderBottomColor: theme.border }]}>
            <Text style={styles.codeLangText}>{language.toUpperCase()}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
            <Text style={[styles.codeText, { color: theme.isDark ? '#8BE9FD' : '#0F0F14' }]}>
              {codeContent}
            </Text>
          </ScrollView>
        </View>
      );
    }

    // Process standard text line-by-line
    const lines = part.split('\n');
    return (
      <View key={index}>
        {lines.map((line, lineIdx) => {
          let cleanLine = line;
          let isHeading = false;
          let headingLevel = 0;
          let isBullet = false;

          // 1. Headings (###, ##, #)
          if (cleanLine.startsWith('#')) {
            const match = cleanLine.match(/^(#{1,6})\s+(.*)$/);
            if (match) {
              headingLevel = match[1].length;
              cleanLine = match[2];
              isHeading = true;
            }
          }

          // 2. Bullet lists
          if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
            cleanLine = cleanLine.substring(2);
            isBullet = true;
          } else {
            const numberedMatch = cleanLine.match(/^(\d+\.\s+)(.*)$/);
            if (numberedMatch) {
              cleanLine = numberedMatch[2];
              isBullet = true;
            }
          }

          // 3. Bold text formatter (**text**)
          const inlineParts = cleanLine.split(/(\*\*.*?\*\*)/g);
          const textElements = inlineParts.map((subPart, subIdx) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return (
                <Text key={subIdx} style={{ fontWeight: 'bold' }}>
                  {subPart.slice(2, -2)}
                </Text>
              );
            }
            return <Text key={subIdx}>{subPart}</Text>;
          });

          if (isHeading) {
            const fontSize = headingLevel === 1 ? 20 : headingLevel === 2 ? 18 : 16;
            return (
              <Text
                key={lineIdx}
                style={[
                  styles.headingText,
                  { fontSize, color: textColor, marginTop: 12, marginBottom: 6, fontWeight: 'bold' }
                ]}
              >
                {textElements}
              </Text>
            );
          }

          if (isBullet) {
            return (
              <View key={lineIdx} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: textColor }]}>•</Text>
                <Text style={[styles.bulletText, { color: textColor }]}>
                  {textElements}
                </Text>
              </View>
            );
          }

          // Skip completely empty lines, but render spacing
          if (cleanLine.trim() === '') {
            return <View key={lineIdx} style={{ height: 6 }} />;
          }

          return (
            <Text
              key={lineIdx}
              style={[
                styles.paragraphText,
                { color: textColor, marginVertical: 2, lineHeight: 22 }
              ]}
            >
              {textElements}
            </Text>
          );
        })}
      </View>
    );
  });
}

const ThinkingDots = ({ theme }: { theme: any }) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  React.useEffect(() => {
    const config = { duration: 400, easing: Easing.inOut(Easing.ease) };
    
    dot1.value = withRepeat(
      withSequence(withTiming(1, config), withTiming(0, config)),
      -1,
      true
    );
    
    dot2.value = withDelay(
      200,
      withRepeat(
        withSequence(withTiming(1, config), withTiming(0, config)),
        -1,
        true
      )
    );
    
    dot3.value = withDelay(
      400,
      withRepeat(
        withSequence(withTiming(1, config), withTiming(0, config)),
        -1,
        true
      )
    );
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value * -4 }],
    opacity: 0.4 + dot1.value * 0.6,
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value * -4 }],
    opacity: 0.4 + dot2.value * 0.6,
  }));
  const style3 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value * -4 }],
    opacity: 0.4 + dot3.value * 0.6,
  }));

  return (
    <View style={styles.thinkingRow}>
      <Animated.View style={[styles.thinkingDot, { backgroundColor: theme.isDark ? '#E7E9EA' : '#64748B' }, style1]} />
      <Animated.View style={[styles.thinkingDot, { backgroundColor: theme.isDark ? '#E7E9EA' : '#64748B' }, style2]} />
      <Animated.View style={[styles.thinkingDot, { backgroundColor: theme.isDark ? '#E7E9EA' : '#64748B', marginRight: 10 }, style3]} />
      <Text style={[styles.thinkingText, { color: theme.textMuted }]}>Thinking...</Text>
    </View>
  );
};

export default function MessageBubble({ role, text, source, page, isStreaming, theme, onPreviewSource }: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  const isUser = role === 'user';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(350)}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer
      ]}
    >
      {/* AI Avatar Icon */}
      {!isUser && (
        <View style={[styles.aiAvatar, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}>
          <Text style={[styles.aiAvatarText, { color: theme.isDark ? '#94A3B8' : '#64748B' }]}>AI</Text>
        </View>
      )}

      <View style={[
        styles.bubble,
        isUser
          ? { backgroundColor: theme.bubbleUser, borderRadius: 20, borderBottomRightRadius: 4, paddingHorizontal: 18, paddingVertical: 11 }
          : {
            backgroundColor: theme.isDark ? 'transparent' : '#FFFFFF',
            borderRadius: theme.isDark ? 0 : 16,
            borderBottomLeftRadius: theme.isDark ? 0 : 4,
            paddingHorizontal: theme.isDark ? 0 : 16,
            paddingVertical: theme.isDark ? 6 : 14,
            maxWidth: '100%',
            borderWidth: theme.isDark ? 0 : 1,
            borderColor: '#E8ECF0',
            ...Platform.select({
              web: theme.isDark ? {} : { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' } as any,
              ios: theme.isDark ? {} : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
              android: theme.isDark ? {} : { elevation: 2 }
            })
          }
      ]}>
        {isStreaming && !text ? (
          <ThinkingDots theme={theme} />
        ) : (
          renderMarkdown(text, theme, isUser)
        )}

        {/* Source metadata display */}
        {source && (
          <TouchableOpacity
            style={[styles.sourceCard, { backgroundColor: theme.inputBg, borderLeftColor: theme.buttonBg }]}
            onPress={() => onPreviewSource && onPreviewSource(source)}
            activeOpacity={0.7}
          >
            <View style={styles.sourceHeader}>
              <FileText size={14} color={theme.buttonBg} style={styles.sourceIcon} />
              <Text style={[styles.sourceText, { color: theme.text }]} numberOfLines={1}>
                {source}
              </Text>
            </View>
            {page && <Text style={styles.pageText}>Page {page}</Text>}
          </TouchableOpacity>
        )}

        {!isUser && !isStreaming && (
          <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
            {copied ? (
              <Check size={14} color="#4ADE80" />
            ) : (
              <Copy size={14} color={theme.textMuted} />
            )}
            <Text style={[styles.copyText, { color: theme.textMuted }, copied && { color: '#4ADE80' }]}>
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-start',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4,
    flexShrink: 0,
  },
  aiAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bubble: {
    maxWidth: Platform.OS === 'web' ? '85%' : '92%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexShrink: 1,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  codeBlock: {
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10,
    overflow: 'hidden',
    width: '100%',
  },
  codeHeader: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  codeLangText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
  },
  headingText: {
    lineHeight: 30,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 15,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
  },
  paragraphText: {
    fontSize: 15,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  thinkingDotSoft: {
    opacity: 0.64,
  },
  thinkingDotMuted: {
    opacity: 0.32,
    marginRight: 10,
  },
  thinkingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sourceCard: {
    marginTop: 12,
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceIcon: {
    marginRight: 6,
  },
  sourceText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  pageText: {
    color: '#8E8E93',
    fontSize: 11,
    marginLeft: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  copyText: {
    color: '#8E8E93',
    fontSize: 12,
    marginLeft: 4,
  },
});
