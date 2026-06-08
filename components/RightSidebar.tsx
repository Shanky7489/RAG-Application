import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Layout, FadeIn, FadeOut } from 'react-native-reanimated';
import { Database, FileText, ChevronRight, Share2, Activity, HardDrive, Layers, Trash2, Search, ListFilter, ShieldCheck } from 'lucide-react-native';
import { deleteDocument, clearAllDocuments } from '../services/api';

const { width } = Dimensions.get('window');
const RIGHT_SIDEBAR_WIDTH = 340; // Slightly wider for trace blocks

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  stats: any;
  queryTrace?: any;
  selectedModel: string;
  theme: any;
  isDesktop?: boolean;
  onRefreshStats?: () => void;
}

export default function RightSidebar({
  isOpen,
  onClose,
  stats,
  queryTrace,
  selectedModel,
  theme,
  isDesktop = false,
  onRefreshStats,
}: RightSidebarProps) {

  const [activeTab, setActiveTab] = useState<'database' | 'query'>('database');
  const [deletingFiles, setDeletingFiles] = React.useState<Record<string, boolean>>({});
  const [hiddenFiles, setHiddenFiles] = React.useState<Record<string, boolean>>({});
  const [expandedChunk, setExpandedChunk] = useState<string | null>(null);

  const translateX = useSharedValue(RIGHT_SIDEBAR_WIDTH);

  React.useEffect(() => {
    translateX.value = withTiming(isOpen ? 0 : RIGHT_SIDEBAR_WIDTH, { duration: 250 });
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: RIGHT_SIDEBAR_WIDTH,
    };
  });

  // Extract relevant stats for the currently selected model
  const currentStats = selectedModel === 'version1' ? stats?.v1 : stats?.v2;
  const isOnline = currentStats?.status === 'online';
  const numChunks = currentStats?.num_chunks || 0;
  const rawFiles = currentStats?.files || [];
  const files = rawFiles.filter((f: string) => !hiddenFiles[f]);
  const graphStats = currentStats?.graph || { connected: false, entities: 0, relationships: 0 };
  const isGraphMode = selectedModel === 'version1';

  const handleDelete = async (fileName: string) => {
    if (deletingFiles[fileName]) return;

    setDeletingFiles(prev => ({ ...prev, [fileName]: true }));
    setHiddenFiles(prev => ({ ...prev, [fileName]: true }));
    try {
      await deleteDocument(fileName, selectedModel);
      if (onRefreshStats) {
        onRefreshStats();
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setDeletingFiles(prev => ({ ...prev, [fileName]: false }));
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Documents",
      "Are you sure you want to delete all ingested documents? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            const allFiles = files.reduce((acc: any, file: string) => ({ ...acc, [file]: true }), {});
            setHiddenFiles(prev => ({ ...prev, ...allFiles }));
            try {
              await clearAllDocuments(selectedModel);
              if (onRefreshStats) onRefreshStats();
            } catch (err) {
              console.error("Failed to clear documents:", err);
            }
          }
        }
      ]
    );
  };

  const renderDatabaseStats = () => (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Status Card */}
      <View style={[styles.card, { backgroundColor: theme.isDark ? '#16181C' : '#F8FAFC' }]}>
        <View style={styles.cardHeader}>
          <Activity size={16} color={isOnline ? '#10B981' : '#EF4444'} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Backend Status</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Engine</Text>
          <View style={[styles.badge, { backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
            <Text style={[styles.badgeText, { color: isOnline ? '#10B981' : '#EF4444' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Vector DB Stats */}
      <View style={[styles.card, { backgroundColor: theme.isDark ? '#16181C' : '#F8FAFC' }]}>
        <View style={styles.cardHeader}>
          <HardDrive size={16} color="#6366F1" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Vector Storage (Qdrant)</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Chunks</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{numChunks.toLocaleString()}</Text>
        </View>
      </View>

      {/* Graph DB Stats */}
      {isGraphMode && (
        <View style={[styles.card, { backgroundColor: theme.isDark ? '#16181C' : '#F8FAFC' }]}>
          <View style={styles.cardHeader}>
            <Share2 size={16} color="#F59E0B" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Graph Storage (Neo4j)</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Connection</Text>
            <View style={[styles.badge, { backgroundColor: graphStats.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
              <Text style={[styles.badgeText, { color: graphStats.connected ? '#10B981' : '#EF4444' }]}>
                {graphStats.connected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Entities</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{graphStats.entities.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Relationships</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{graphStats.relationships.toLocaleString()}</Text>
          </View>
        </View>
      )}

      {/* Ingested Files List */}
      <View style={[styles.card, { backgroundColor: theme.isDark ? '#16181C' : '#F8FAFC', marginBottom: 40 }]}>
        <View style={styles.cardHeader}>
          <Layers size={16} color="#3B82F6" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Ingested Documents</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{files.length}</Text>
          </View>
          {files.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {files.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No documents ingested yet.</Text>
        ) : (
          <View style={styles.fileList}>
            {files.map((file: string, idx: number) => (
              <View key={idx} style={[styles.fileItem, { borderBottomColor: theme.isDark ? '#2F3336' : '#E2E8F0' }]}>
                <FileText size={14} color={theme.isDark ? '#94A3B8' : '#64748B'} style={{ marginRight: 8 }} />
                <Text style={[styles.fileName, { color: theme.text, opacity: deletingFiles[file] ? 0.5 : 1 }]} numberOfLines={1} ellipsizeMode="middle">
                  {file}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(file)}
                  disabled={deletingFiles[file]}
                  style={{ padding: 4 }}
                >
                  <Trash2 size={16} color={deletingFiles[file] ? '#94A3B8' : '#EF4444'} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderChunkBlock = (chunk: any, stageIdx: number) => {
    const isExpanded = expandedChunk === `${stageIdx}-${chunk.id}`;

    // Color coding based on weight
    let bgColor = theme.isDark ? '#1E293B' : '#E2E8F0'; // default gray
    let borderCol = theme.isDark ? '#334155' : '#CBD5E1';
    let textCol = theme.text;

    if (chunk.weight >= 0.7) {
      bgColor = theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5';
      borderCol = '#10B981';
      textCol = theme.isDark ? '#34D399' : '#047857';
    } else if (chunk.weight >= 0.4) {
      bgColor = theme.isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7';
      borderCol = '#F59E0B';
      textCol = theme.isDark ? '#FBBF24' : '#B45309';
    } else if (chunk.weight > 0) {
      bgColor = theme.isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2';
      borderCol = '#EF4444';
      textCol = theme.isDark ? '#F87171' : '#B91C1C';
    }

    return (
      <Animated.View key={`${stageIdx}-${chunk.id}`} layout={Layout.springify().damping(15)}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpandedChunk(isExpanded ? null : `${stageIdx}-${chunk.id}`)}
          style={[
            styles.chunkBlock,
            { backgroundColor: bgColor, borderColor: borderCol, borderWidth: 1, padding: 2 }
          ]}
        >
          <Text style={[styles.chunkIdText, { color: textCol }]} numberOfLines={1}>
            #{chunk.chunk_index ?? chunk.id.substring(0, 4)}
          </Text>
          <Text style={[styles.chunkWeightText, { color: textCol }]}>
            {(chunk.weight * 100).toFixed(0)}%
          </Text>
          {chunk.graph_score > 0 && (
            <Text style={[styles.chunkWeightText, { color: theme.isDark ? '#FBBF24' : '#D97706', fontSize: 9, marginTop: 1 }]} numberOfLines={1}>
              G:{(chunk.graph_score * 100).toFixed(0)}%
            </Text>
          )}
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[styles.chunkExpandedView, { backgroundColor: theme.isDark ? '#1C1F26' : '#FFFFFF', borderColor: theme.border }]}
          >
            <View style={styles.chunkDetailRow}>
              <Text style={[styles.chunkDetailLabel, { color: theme.textMuted }]}>Source:</Text>
              <Text style={[styles.chunkDetailValue, { color: theme.text }]} numberOfLines={1}>{chunk.source}</Text>
            </View>
            <View style={styles.chunkDetailRow}>
              <Text style={[styles.chunkDetailLabel, { color: theme.textMuted }]}>Weights:</Text>
              <Text style={[styles.chunkDetailValue, { color: theme.text }]}>
                Total: {(chunk.weight).toFixed(3)} | Qdrant: {(chunk.qdrant_score || 0).toFixed(3)}
                {chunk.graph_score > 0 ? ` | Graph: ${(chunk.graph_score).toFixed(3)}` : ''}
              </Text>
            </View>
            <Text style={[styles.chunkDetailText, { color: theme.textMuted }]}>
              {chunk.text.substring(0, 300)}{chunk.text.length > 300 ? '...' : ''}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const renderQueryStats = () => {
    if (!queryTrace || !queryTrace.trace || !queryTrace.trace.stages || queryTrace.trace.stages.length === 0) {
      return (
        <View style={styles.emptyTraceContainer}>
          <Search size={40} color={theme.isDark ? '#334155' : '#CBD5E1'} />
          <Text style={[styles.emptyTraceText, { color: theme.textMuted }]}>
            No query trace available. Send a message to see how the RAG pipeline filters chunks.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {queryTrace.trace.stages.map((stage: any, idx: number) => (
          <View key={idx} style={styles.stageContainer}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageIconBg, { backgroundColor: theme.isDark ? '#1E293B' : '#E2E8F0' }]}>
                {idx === 0 ? <Database size={14} color="#3B82F6" /> :
                  idx === queryTrace.trace.stages.length - 1 ? <ShieldCheck size={14} color="#10B981" /> :
                    <ListFilter size={14} color="#8B5CF6" />}
              </View>
              <Text style={[styles.stageTitle, { color: theme.text }]}>{stage.name}</Text>
              <Text style={[styles.stageCount, { color: theme.textMuted }]}>{stage.chunks.length} chunks</Text>
            </View>

            <View style={styles.stageLineContainer}>
              <View style={[styles.verticalLine, { backgroundColor: theme.border }]} />
              <View style={styles.chunksWrap}>
                {stage.chunks.map((c: any) => renderChunkBlock(c, idx))}
                {stage.chunks.length === 0 && (
                  <Text style={[styles.noChunksText, { color: theme.textMuted }]}>0 chunks survived</Text>
                )}
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <>
      {isOpen && !isDesktop && (
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      )}
      <Animated.View style={[
        styles.container,
        {
          backgroundColor: theme.sidebarBg,
          position: isDesktop ? 'relative' : 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        },
        !isDesktop && animatedStyle,
        isDesktop && { display: isOpen ? 'flex' : 'none', width: RIGHT_SIDEBAR_WIDTH }
      ]}>

        {/* Header Tabs */}
        <View style={styles.header}>
          <View style={[styles.tabGroup, { backgroundColor: theme.isDark ? '#16181C' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'database' && [styles.tabBtnActive, { backgroundColor: theme.isDark ? '#2F3336' : '#FFFFFF' }]]}
              onPress={() => setActiveTab('database')}
            >
              <Database size={14} color={activeTab === 'database' ? (theme.isDark ? '#FFFFFF' : '#000000') : theme.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, { color: activeTab === 'database' ? (theme.isDark ? '#FFFFFF' : '#000000') : theme.textMuted }]}>DB Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'query' && [styles.tabBtnActive, { backgroundColor: theme.isDark ? '#2F3336' : '#FFFFFF' }]]}
              onPress={() => setActiveTab('query')}
            >
              <Activity size={14} color={activeTab === 'query' ? (theme.isDark ? '#FFFFFF' : '#000000') : theme.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, { color: activeTab === 'query' ? (theme.isDark ? '#FFFFFF' : '#000000') : theme.textMuted }]}>Query Stats</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? '#16181C' : '#F1F5F9' }]}>
            <ChevronRight size={18} color={theme.isDark ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>
        </View>

        {activeTab === 'database' ? renderDatabaseStats() : renderQueryStats()}

      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    flexShrink: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 99,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // Used to be solid, removed for cleaner look
  },
  tabGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    flex: 1,
    marginRight: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statLabel: {
    fontSize: 15,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  countBadgeText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
  },
  fileList: {
    marginTop: 6,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  emptyText: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  fileName: {
    fontSize: 15,
    flex: 1,
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },

  // Trace UI styles
  emptyTraceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTraceText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  stageContainer: {
    marginBottom: 20,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stageIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  stageCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  stageLineContainer: {
    flexDirection: 'row',
    paddingLeft: 11, // align with center of stageIconBg (24/2 - 1)
  },
  verticalLine: {
    width: 2,
    marginRight: 16,
  },
  chunksWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  chunkBlock: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  chunkIdText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chunkWeightText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  noChunksText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  chunkExpandedView: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  chunkDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chunkDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 50,
  },
  chunkDetailValue: {
    fontSize: 11,
    flex: 1,
  },
  chunkDetailText: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  }
});
