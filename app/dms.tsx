import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, ScrollView, ActivityIndicator, Alert, Platform,
  useWindowDimensions, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  Search, FileText, Edit2, Save, GitCompare, ChevronDown,
  ChevronUp, X, Check, Layers, ArrowLeft, Sparkles,
  Trash2, Sun, Moon, RefreshCw, UploadCloud, ArrowRightLeft,
} from 'lucide-react-native';
import {
  getDocumentContent, updateDocumentContent, searchDocuments,
  deleteDocument, clearAllDocuments, API_BASE_URL,
  previewParseDocument, replaceDocument,
} from '../services/api';
import Markdown from 'react-native-markdown-display';

// ─── Theme ───────────────────────────────────────────────────────────────────

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
  cardBg: string;
  accent: string;
  accentSoft: string;
  dangerBg: string;
  danger: string;
  successBg: string;
  success: string;
}

const darkTheme: ThemeColors = {
  isDark: true,
  background: '#212121',
  sidebarBg: '#171717',
  headerBg: '#171717',
  border: '#303030',
  text: '#ECECEC',
  textMuted: '#B4B4B4',
  inputBg: '#2F2F2F',
  inputBorder: '#424242',
  cardBg: '#1C1C1C',
  accent: '#6366F1',
  accentSoft: 'rgba(99, 102, 241, 0.12)',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  danger: '#EF4444',
  successBg: 'rgba(16, 185, 129, 0.12)',
  success: '#10B981',
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
  cardBg: '#F8FAFC',
  accent: '#6366F1',
  accentSoft: 'rgba(99, 102, 241, 0.08)',
  dangerBg: 'rgba(239, 68, 68, 0.06)',
  danger: '#EF4444',
  successBg: 'rgba(16, 185, 129, 0.08)',
  success: '#10B981',
};

// ─── Highlighted Text Helper ─────────────────────────────────────────────────

const HighlightedText = ({ text, highlight, theme }: { text: string; highlight: string; theme: ThemeColors }) => {
  if (!highlight || !highlight.trim()) return <Text style={{ color: theme.text }}>{text}</Text>;

  const escapedQuery = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text style={{ color: theme.text }}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <Text key={i} style={{ backgroundColor: 'rgba(99, 102, 241, 0.25)', color: theme.accent, fontWeight: '700', borderRadius: 3 }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
};

// ─── Markdown Theme Styles ───────────────────────────────────────────────────

const getMarkdownStyles = (theme: ThemeColors) => ({
  body: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 26,
  },
  heading1: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800' as const,
    marginTop: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 8,
  },
  heading2: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 20,
    marginBottom: 10,
  },
  heading3: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  heading4: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 12,
  },
  strong: {
    color: theme.text,
    fontWeight: '700' as const,
  },
  em: {
    color: theme.textMuted,
    fontStyle: 'italic' as const,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  list_item: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
  code_inline: {
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
    color: theme.accent,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fence: {
    backgroundColor: theme.isDark ? '#1E1E2E' : '#F1F5F9',
    color: theme.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  code_block: {
    backgroundColor: theme.isDark ? '#1E1E2E' : '#F1F5F9',
    color: theme.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  blockquote: {
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.06)' : 'rgba(99, 102, 241, 0.04)',
    borderLeftWidth: 4,
    borderLeftColor: theme.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    marginBottom: 12,
  },
  thead: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  },
  th: {
    color: theme.text,
    fontWeight: '700' as const,
    fontSize: 13,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    borderRightWidth: 1,
    borderRightColor: theme.border,
  },
  td: {
    color: theme.text,
    fontSize: 13,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    borderRightWidth: 1,
    borderRightColor: theme.border,
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  hr: {
    backgroundColor: theme.border,
    height: 1,
    marginVertical: 16,
  },
  link: {
    color: theme.accent,
    textDecorationLine: 'underline' as const,
  },
  image: {
    borderRadius: 8,
    marginVertical: 8,
  },
});

// ─── Main DMS Page ───────────────────────────────────────────────────────────

export default function DmsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Theme
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? darkTheme : lightTheme;

  // RAG version
  const [ragVersion, setRagVersion] = useState<'version1' | 'version2'>('version1');

  // Document list
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<any>(null);

  // Document viewer
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Editor
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Compare
  const [isComparing, setIsComparing] = useState(false);
  const [compareFile, setCompareFile] = useState<string | null>(null);
  const [compareContent, setCompareContent] = useState('');
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [showCompareDropdown, setShowCompareDropdown] = useState(false);

  // Upload Compare
  const [isUploadedCompare, setIsUploadedCompare] = useState(false);
  const [uploadedCompareFileName, setUploadedCompareFileName] = useState<string | null>(null);
  const [uploadedCompareFileUri, setUploadedCompareFileUri] = useState<string | null>(null);
  const [uploadedCompareFileType, setUploadedCompareFileType] = useState<string | null>(null);
  const [isParsingUpload, setIsParsingUpload] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  // Expand matches
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  const [snippetLimit, setSnippetLimit] = useState<Record<string, number>>({});

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Deleting
  const [deletingFiles, setDeletingFiles] = useState<Record<string, boolean>>({});

  // Paragraph tracking & scrolling
  const [selectedParagraphIndex, setSelectedParagraphIndex] = useState<number | null>(null);
  const paragraphLayouts = useRef<Record<number, number>>({});
  const mainScrollViewRef = useRef<any>(null);

  useEffect(() => {
    setSelectedParagraphIndex(null);
    paragraphLayouts.current = {};
  }, [selectedFile, searchQuery]);

  // ─── Data loading ────────────────────────────────────────────────────────────

  const fetchFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      const data = await response.json();
      const stats = ragVersion === 'version1' ? data?.v1 : data?.v2;
      setAllFiles(stats?.files || []);
    } catch (e) {
      console.error('Failed to fetch files', e);
      setAllFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [ragVersion]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ─── Search with debounce ────────────────────────────────────────────────────

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (text.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchDocuments(text, ragVersion);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // ─── Filtered document list ──────────────────────────────────────────────────

  const displayDocs = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      // Show search results
      return searchResults.map((r: any) => ({
        name: r.file_name,
        matchCount: r.matches || 0,
        snippets: r.snippets || [],
      }));
    }
    return allFiles.map((f: string) => ({
      name: f,
      matchCount: 0,
      snippets: [],
    }));
  }, [allFiles, searchQuery, searchResults]);

  // ─── Select document ─────────────────────────────────────────────────────────

  const handleSelectDoc = async (fileName: string): Promise<string | null> => {
    if (selectedFile === fileName && !isEditing) return selectedContent;
    setSelectedFile(fileName);
    setIsEditing(false);
    setIsComparing(false);
    setCompareFile(null);
    setIsLoadingContent(true);
    try {
      const data = await getDocumentContent(fileName, ragVersion);
      setSelectedContent(data.content || '');
      setEditContent(data.content || '');
      return data.content || '';
    } catch (err) {
      showToast('Could not load document content.');
      setSelectedFile(null);
      return null;
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleSnippetClick = async (fileName: string, snippetText: string) => {
    const content = await handleSelectDoc(fileName);
    if (!content) return;

    // strip off leading/trailing '...'
    const cleanSnip = snippetText.replace(/^\.\.\.\s*/, '').replace(/\s*\.\.\.$/, '').trim();

    const paragraphs = content.split('\n\n');
    const matchIdx = paragraphs.findIndex(para => {
      const cleanPara = para.replace(/\s+/g, ' ').toLowerCase();
      const cleanTarget = cleanSnip.replace(/\s+/g, ' ').toLowerCase();
      return cleanPara.includes(cleanTarget);
    });

    if (matchIdx !== -1) {
      setSelectedParagraphIndex(matchIdx);
      
      // Delay slightly for render layout computation
      setTimeout(() => {
        const yCoord = paragraphLayouts.current[matchIdx];
        if (typeof yCoord === 'number') {
          mainScrollViewRef.current?.scrollTo({ y: Math.max(0, yCoord - 40), animated: true });
        }
      }, 350);
    }
  };

  // ─── Edit / Save ─────────────────────────────────────────────────────────────

  const handleStartEdit = () => {
    setEditContent(selectedContent);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const result = await updateDocumentContent(selectedFile, editContent, ragVersion);
      setSelectedContent(editContent);
      setIsEditing(false);
      showToast(`Saved & re-ingested (${result.chunks_indexed || 0} chunks)`);
      fetchFiles();
    } catch (err) {
      showToast('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(selectedContent);
    setIsEditing(false);
  };

  // ─── Compare ─────────────────────────────────────────────────────────────────

  const handleCompare = async (fileName: string) => {
    setCompareFile(fileName);
    setIsComparing(true);
    setShowCompareDropdown(false);
    setIsLoadingCompare(true);
    try {
      const data = await getDocumentContent(fileName, ragVersion);
      setCompareContent(data.content || '');
    } catch (err) {
      showToast('Could not load comparison document.');
      setIsComparing(false);
      setCompareFile(null);
    } finally {
      setIsLoadingCompare(false);
    }
  };

  const handleStopCompare = () => {
    setIsComparing(false);
    setCompareFile(null);
    setCompareContent('');
    setIsUploadedCompare(false);
    setUploadedCompareFileName(null);
    setUploadedCompareFileUri(null);
    setUploadedCompareFileType(null);
  };

  const handleUploadCompare = async () => {
    setShowCompareDropdown(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const fileName = file.name;
      const fileUri = file.uri;
      const fileType = file.mimeType || 'application/pdf';

      setIsParsingUpload(true);
      setIsComparing(true);
      setIsUploadedCompare(true);
      setUploadedCompareFileName(fileName);
      setUploadedCompareFileUri(fileUri);
      setUploadedCompareFileType(fileType);
      
      const parsedData = await previewParseDocument(fileUri, fileName, fileType, ragVersion);
      setCompareContent(parsedData.content || '');
    } catch (err) {
      console.error('Upload compare failed:', err);
      showToast('Failed to parse uploaded document.');
      handleStopCompare();
    } finally {
      setIsParsingUpload(false);
    }
  };

  const handleReplaceAndIngest = async () => {
    if (!selectedFile || !uploadedCompareFileUri || !uploadedCompareFileName) return;
    
    const doReplace = async () => {
      setIsReplacing(true);
      try {
        const result = await replaceDocument(
          uploadedCompareFileUri,
          uploadedCompareFileName,
          uploadedCompareFileType || 'application/pdf',
          selectedFile,
          ragVersion
        );
        
        showToast(`Replaced successfully! Indexed ${result.chunks_indexed || 0} chunks.`);
        handleStopCompare();
        
        // Refresh the file list and select the new file
        await fetchFiles();
        setSelectedFile(uploadedCompareFileName);
        
        // Load the new file content
        setIsLoadingContent(true);
        const data = await getDocumentContent(uploadedCompareFileName, ragVersion);
        setSelectedContent(data.content || '');
        setEditContent(data.content || '');
      } catch (err) {
        console.error('Replace failed:', err);
        showToast('Failed to replace document.');
      } finally {
        setIsReplacing(false);
        setIsLoadingContent(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Replace "${selectedFile}" with "${uploadedCompareFileName}"? The old file will be permanently deleted.`)) {
        doReplace();
      }
    } else {
      Alert.alert(
        'Replace Document',
        `Replace "${selectedFile}" with "${uploadedCompareFileName}"? The old file will be permanently deleted.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace & Ingest', style: 'destructive', onPress: doReplace },
        ]
      );
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (fileName: string) => {
    const doDelete = async () => {
      setDeletingFiles(prev => ({ ...prev, [fileName]: true }));
      try {
        await deleteDocument(fileName, ragVersion);
        if (selectedFile === fileName) {
          setSelectedFile(null);
          setSelectedContent('');
        }
        fetchFiles();
        showToast('Document deleted');
      } catch (err) {
        showToast('Failed to delete document');
      } finally {
        setDeletingFiles(prev => ({ ...prev, [fileName]: false }));
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${fileName}"? This cannot be undone.`)) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Document', `Delete "${fileName}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // ─── Toast ───────────────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ─── RAG toggle ──────────────────────────────────────────────────────────────

  const handleToggleRag = (version: 'version1' | 'version2') => {
    setRagVersion(version);
    setSelectedFile(null);
    setIsComparing(false);
    setCompareFile(null);
    setSearchQuery('');
    setSearchResults([]);
    setExpandedMatches({});
    setSnippetLimit({});
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const comparableDocs = allFiles.filter(f => f !== selectedFile);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* ─── HEADER ─── */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <View style={styles.headerBrand}>
            <View style={[styles.brandIcon, { backgroundColor: theme.accent }]}>
              <Sparkles size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.brandText, { color: theme.text }]}>
              Lex<Text style={{ fontWeight: '400' }}>Docs</Text>
            </Text>
          </View>
        </View>

        <View style={styles.headerCenter}>
          {/* RAG Version Toggle */}
          <View style={[styles.ragToggle, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <TouchableOpacity
              onPress={() => handleToggleRag('version1')}
              style={[
                styles.ragToggleBtn,
                ragVersion === 'version1' && { backgroundColor: theme.isDark ? '#2F2F2F' : '#FFFFFF' },
              ]}
            >
              <Text style={[styles.ragToggleText, { color: ragVersion === 'version1' ? theme.accent : theme.textMuted }]}>
                RAG v1
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleToggleRag('version2')}
              style={[
                styles.ragToggleBtn,
                ragVersion === 'version2' && { backgroundColor: theme.isDark ? '#2F2F2F' : '#FFFFFF' },
              ]}
            >
              <Text style={[styles.ragToggleText, { color: ragVersion === 'version2' ? theme.accent : theme.textMuted }]}>
                RAG v2
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => fetchFiles()} style={[styles.iconBtn, { backgroundColor: theme.inputBg }]}>
            <RefreshCw size={16} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsDark(!isDark)} style={[styles.iconBtn, { backgroundColor: theme.inputBg }]}>
            {isDark ? <Sun size={16} color="#FBBF24" /> : <Moon size={16} color="#6366F1" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── BODY ─── */}
      <View style={styles.body}>

        {/* ─── LEFT SIDEBAR: Document List ─── */}
        <View style={[styles.sidebar, { backgroundColor: theme.sidebarBg, borderRightColor: theme.border, width: isDesktop ? 380 : 280 }]}>

          {/* Search Bar */}
          <View style={styles.sidebarTop}>
            <View style={styles.sidebarTitleRow}>
              <Layers size={14} color={theme.textMuted} />
              <Text style={[styles.sidebarTitle, { color: theme.textMuted }]}>
                REPOSITORY ({isLoadingFiles ? '...' : displayDocs.length})
              </Text>
            </View>

            <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <Search size={16} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search documents or content..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <X size={14} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Document List */}
          <ScrollView style={styles.docList} showsVerticalScrollIndicator={false}>
            {isLoadingFiles ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>Loading...</Text>
              </View>
            ) : isSearching ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>Searching...</Text>
              </View>
            ) : displayDocs.length === 0 ? (
              <View style={styles.emptyState}>
                <Search size={32} color={theme.border} />
                <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
                  {searchQuery ? 'No matching documents' : 'No documents ingested yet'}
                </Text>
              </View>
            ) : (
              displayDocs.map((doc, idx) => {
                const isSelected = selectedFile === doc.name;
                const isDeleting = deletingFiles[doc.name];
                const hasMatches = searchQuery.trim().length > 0 && doc.matchCount > 0;
                const isExpanded = expandedMatches[doc.name];

                return (
                  <View key={`${doc.name}-${idx}`}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelectDoc(doc.name)}
                      style={[
                        styles.docItem,
                        {
                          backgroundColor: isSelected ? theme.accentSoft : 'transparent',
                          borderLeftColor: isSelected ? theme.accent : 'transparent',
                        },
                      ]}
                    >
                      <View style={styles.docItemContent}>
                        <FileText
                          size={16}
                          color={isSelected ? theme.accent : theme.textMuted}
                          style={{ marginRight: 10, marginTop: 2 }}
                        />
                        <View style={{ flex: 1 }}>
                          {searchQuery.trim() ? (
                            <HighlightedText text={doc.name} highlight={searchQuery} theme={theme} />
                          ) : (
                            <Text
                              style={[styles.docName, { color: theme.text, opacity: isDeleting ? 0.4 : 1 }]}
                              numberOfLines={2}
                            >
                              {doc.name}
                            </Text>
                          )}

                          {hasMatches && (
                            <View style={styles.matchRow}>
                              <View style={[styles.matchBadge, { backgroundColor: theme.accentSoft }]}>
                                <Text style={[styles.matchBadgeText, { color: theme.accent }]}>
                                  {doc.matchCount} match{doc.matchCount !== 1 ? 'es' : ''}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  setExpandedMatches(prev => ({ ...prev, [doc.name]: !prev[doc.name] }));
                                }}
                                style={styles.expandBtn}
                              >
                                {isExpanded ? (
                                  <ChevronUp size={14} color={theme.textMuted} />
                                ) : (
                                  <ChevronDown size={14} color={theme.textMuted} />
                                )}
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>

                        {/* Delete Button */}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleDelete(doc.name);
                          }}
                          disabled={isDeleting}
                          style={styles.deleteBtn}
                        >
                          <Trash2 size={14} color={isDeleting ? theme.textMuted : theme.danger} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Snippets */}
                    {hasMatches && isExpanded && doc.snippets.length > 0 && (
                      <View style={[styles.snippetContainer, { backgroundColor: theme.cardBg, borderLeftColor: theme.accent }]}>
                        {doc.snippets.slice(0, snippetLimit[doc.name] || 5).map((snip: string, sIdx: number) => (
                          <TouchableOpacity
                            key={sIdx}
                            activeOpacity={0.7}
                            onPress={() => handleSnippetClick(doc.name, snip)}
                            style={[styles.snippetBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                          >
                            <HighlightedText text={`...${snip}...`} highlight={searchQuery} theme={theme} />
                          </TouchableOpacity>
                        ))}
                        {doc.snippets.length > (snippetLimit[doc.name] || 5) && (
                          <TouchableOpacity
                            onPress={() => setSnippetLimit(prev => ({ ...prev, [doc.name]: (prev[doc.name] || 5) + 5 }))}
                            style={{ alignSelf: 'center', marginTop: 8, padding: 8 }}
                          >
                            <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}>Load more previews...</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>

        {/* ─── RIGHT PANE: Document Viewer / Editor ─── */}
        <View style={[styles.mainPane, { backgroundColor: theme.background }]}>

          {/* Toast */}
          {toastMessage ? (
            <View style={styles.toastContainer}>
              <View style={[styles.toast, { backgroundColor: theme.isDark ? '#1E293B' : '#0F172A' }]}>
                <View style={[styles.toastIcon, { backgroundColor: theme.success }]}>
                  <Check size={10} color="#FFF" strokeWidth={3} />
                </View>
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            </View>
          ) : null}

          {!selectedFile ? (
            /* ─── Empty State ─── */
            <View style={styles.emptyViewer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.inputBg }]}>
                <FileText size={36} color={theme.border} />
              </View>
              <Text style={[styles.emptyViewerTitle, { color: theme.text }]}>
                Select a document
              </Text>
              <Text style={[styles.emptyViewerSub, { color: theme.textMuted }]}>
                Choose an item from the repository to view or edit.
              </Text>
            </View>
          ) : (
            /* ─── Document Display ─── */
            <View style={{ flex: 1 }}>

              {/* Toolbar */}
              <View style={[styles.toolbar, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <Text style={[styles.toolbarTitle, { color: theme.text }]} numberOfLines={1}>
                  {selectedFile}
                </Text>

                <View style={styles.toolbarActions}>
                  {isComparing ? (
                    <TouchableOpacity onPress={handleStopCompare} style={[styles.actionBtn, { backgroundColor: theme.inputBg }]}>
                      <ArrowLeft size={14} color={theme.textMuted} />
                      <Text style={[styles.actionBtnText, { color: theme.text }]}>Stop Comparing</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      {/* Compare Dropdown */}
                      {comparableDocs.length > 0 && (
                        <View>
                          <TouchableOpacity
                            onPress={() => setShowCompareDropdown(!showCompareDropdown)}
                            style={[styles.actionBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                          >
                            <GitCompare size={14} color={theme.textMuted} />
                            <Text style={[styles.actionBtnText, { color: theme.text }]}>Compare</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Edit / Save */}
                      {isEditing ? (
                        <View style={styles.editActions}>
                          <TouchableOpacity onPress={handleCancelEdit} style={[styles.actionBtn, { backgroundColor: theme.inputBg }]}>
                            <X size={14} color={theme.textMuted} />
                            <Text style={[styles.actionBtnText, { color: theme.text }]}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving}
                            style={[styles.actionBtn, { backgroundColor: theme.accent, opacity: isSaving ? 0.7 : 1 }]}
                          >
                            {isSaving ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <>
                                <Save size={14} color="#FFF" />
                                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Save & Re-ingest</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={handleStartEdit}
                          style={[styles.actionBtn, { backgroundColor: theme.isDark ? '#ECECEC' : '#0D0D0D' }]}
                        >
                          <Edit2 size={14} color={theme.isDark ? '#0D0D0D' : '#FFFFFF'} />
                          <Text style={[styles.actionBtnText, { color: theme.isDark ? '#0D0D0D' : '#FFFFFF' }]}>Edit Text</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>

              {/* Compare Dropdown Panel */}
              {showCompareDropdown && (
                <View style={[styles.compareDropdown, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.compareDropdownLabel, { color: theme.textMuted }]}>COMPARE AGAINST</Text>
                  <ScrollView style={{ maxHeight: 200 }}>
                    <TouchableOpacity
                      onPress={handleUploadCompare}
                      style={[styles.compareDropdownItem, { borderBottomColor: theme.border }]}
                    >
                      <UploadCloud size={14} color={theme.textMuted} style={{ marginRight: 8 }} />
                      <Text style={[styles.compareDropdownItemText, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                        Upload New Document
                      </Text>
                    </TouchableOpacity>
                    {comparableDocs.map((fileName) => (
                      <TouchableOpacity
                        key={fileName}
                        onPress={() => handleCompare(fileName)}
                        style={[styles.compareDropdownItem, { borderBottomColor: theme.border }]}
                      >
                        <FileText size={14} color={theme.textMuted} style={{ marginRight: 8 }} />
                        <Text style={[styles.compareDropdownItemText, { color: theme.text }]} numberOfLines={1}>
                          {fileName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Content Area */}
              <View style={[styles.contentArea, isComparing && styles.contentAreaSplit]}>

                {/* Primary Document */}
                <View style={[
                  styles.contentPane,
                  isComparing && { borderRightWidth: 1, borderRightColor: theme.border },
                ]}>
                  {isComparing && (
                    <View style={[styles.paneLabel, { backgroundColor: theme.accentSoft }]}>
                      <View style={[styles.paneDot, { backgroundColor: theme.accent }]} />
                      <Text style={[styles.paneLabelText, { color: theme.accent }]}>PRIMARY</Text>
                    </View>
                  )}

                  <ScrollView
                    ref={mainScrollViewRef}
                    style={styles.contentScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {isLoadingContent ? (
                      <View style={styles.contentLoading}>
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text style={[styles.contentLoadingText, { color: theme.textMuted }]}>
                          Loading content...
                        </Text>
                      </View>
                    ) : isEditing && !isComparing ? (
                      <View style={styles.editorWrap}>
                        <TextInput
                          style={[
                            styles.editorTextInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.cardBg,
                              borderColor: theme.accent,
                            },
                          ]}
                          multiline
                          value={editContent}
                          onChangeText={setEditContent}
                          textAlignVertical="top"
                          placeholder="Start typing your document content here..."
                          placeholderTextColor={theme.textMuted}
                        />
                      </View>
                    ) : (
                      <View style={[styles.contentCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                        {searchQuery.trim().length > 0 ? (
                          <View style={{ gap: 16 }}>
                            {selectedContent.split('\n\n').map((para, pIdx) => (
                              <View
                                key={pIdx}
                                onLayout={(event) => {
                                  paragraphLayouts.current[pIdx] = event.nativeEvent.layout.y;
                                }}
                                style={[
                                  selectedParagraphIndex === pIdx && {
                                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.08)',
                                    borderColor: theme.accent,
                                    borderWidth: 1.5,
                                    borderRadius: 10,
                                    padding: 12,
                                  }
                                ]}
                              >
                                <HighlightedText text={para} highlight={searchQuery} theme={theme} />
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Markdown style={getMarkdownStyles(theme)}>{selectedContent}</Markdown>
                        )}
                      </View>
                    )}
                    <View style={{ height: 40 }} />
                  </ScrollView>
                </View>

                {/* Comparison Document */}
                {isComparing && (
                  <View style={styles.contentPane}>
                    <View style={[styles.paneLabel, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <View style={[styles.paneDot, { backgroundColor: theme.textMuted }]} />
                      <Text style={[styles.paneLabelText, { color: theme.textMuted }]} numberOfLines={1}>
                        {isUploadedCompare ? `UPLOADED: ${uploadedCompareFileName}` : 'COMPARISON'}
                      </Text>
                      {isUploadedCompare && (
                        <TouchableOpacity
                          onPress={handleReplaceAndIngest}
                          disabled={isReplacing || isParsingUpload}
                          style={[
                            styles.actionBtn, 
                            { 
                              backgroundColor: theme.success, 
                              marginLeft: 'auto', 
                              marginRight: 8, 
                              opacity: (isReplacing || isParsingUpload) ? 0.7 : 1,
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                            }
                          ]}
                        >
                          {isReplacing ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <ArrowRightLeft size={12} color="#FFF" />
                              <Text style={[styles.actionBtnText, { color: '#FFF', fontSize: 11 }]}>Replace & Ingest</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={handleStopCompare} style={{ marginLeft: isUploadedCompare ? 0 : 'auto', padding: 4 }}>
                        <X size={14} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                      {isParsingUpload ? (
                        <View style={styles.contentLoading}>
                          <ActivityIndicator size="large" color={theme.accent} />
                          <Text style={[styles.contentLoadingText, { color: theme.textMuted }]}>
                            Parsing uploaded document...
                          </Text>
                        </View>
                      ) : isLoadingCompare ? (
                        <View style={styles.contentLoading}>
                          <ActivityIndicator size="large" color={theme.accent} />
                          <Text style={[styles.contentLoadingText, { color: theme.textMuted }]}>
                            Loading comparison...
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.contentCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                          {searchQuery.trim().length > 0 ? (
                            <HighlightedText text={compareContent} highlight={searchQuery} theme={theme} />
                          ) : (
                            <Markdown style={getMarkdownStyles(theme)}>{compareContent}</Markdown>
                          )}
                        </View>
                      )}
                      <View style={{ height: 40 }} />
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ragToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  ragToggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ragToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },

  // Body
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    borderRightWidth: 1,
  },
  sidebarTop: {
    padding: 16,
    gap: 12,
  },
  sidebarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },

  // Document List
  docList: {
    flex: 1,
  },
  docItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
  },
  docItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expandBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },

  // Snippets
  snippetContainer: {
    marginLeft: 16,
    paddingLeft: 12,
    paddingVertical: 8,
    borderLeftWidth: 2,
    gap: 6,
  },
  snippetBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Main Pane
  mainPane: {
    flex: 1,
    position: 'relative',
  },

  // Empty viewer
  emptyViewer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyViewerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyViewerSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
    borderBottomWidth: 1,
  },
  toolbarTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 16,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Compare Dropdown
  compareDropdown: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    zIndex: 50,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  compareDropdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  compareDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  compareDropdownItemText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // Content Area
  contentArea: {
    flex: 1,
  },
  contentAreaSplit: {
    flexDirection: 'row',
  },
  contentPane: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
    padding: 24,
  },
  contentLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  contentLoadingText: {
    fontSize: 14,
  },
  contentCard: {
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
  },

  // Pane Label (for compare)
  paneLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  paneDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  paneLabelText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Editor
  editorWrap: {
    flex: 1,
  },
  editorTextInput: {
    minHeight: 500,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    fontSize: 15,
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  toastIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
