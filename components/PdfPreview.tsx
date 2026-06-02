import React from 'react';
import { View, Text, Platform, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { Asset } from 'expo-asset';
import { FileText, ExternalLink } from 'lucide-react-native';

interface PdfPreviewProps {
  theme: any;
  isDesktop?: boolean;
}

export default function PdfPreview({ theme, isDesktop }: PdfPreviewProps) {
  // Require the local PDF from assets
  const pdfAsset = require('../assets/MSME_Samadhaan_Form copy.pdf');
  const resolvedAsset = Asset.fromModule(pdfAsset);
  const pdfUrl = resolvedAsset ? resolvedAsset.uri : '';

  const handleOpenPdf = () => {
    Linking.openURL(pdfUrl).catch(err => {
      console.error("Failed to open PDF", err);
      // Fallback if local URI fails on device
      Linking.openURL('https://samadhaan.msme.gov.in/MyMsme/MSEFC/COM_MSEFC_Ent.aspx');
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={handleOpenPdf}
        style={[
          styles.chip, 
          { 
            backgroundColor: theme.isDark ? '#1E293B' : '#FFFFFF',
            borderColor: theme.isDark ? '#334155' : '#E2E8F0',
            borderWidth: 1,
            shadowColor: theme.isDark ? '#000' : '#64748B',
          }
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.isDark ? '#334155' : '#F8FAFC' }]}>
          <FileText size={18} color={theme.isDark ? '#818CF8' : '#6366F1'} />
        </View>
        
        <View style={styles.chipTextContainer}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }} numberOfLines={1}>
            MSME_Samadhaan_Form.pdf
          </Text>
          <Text style={{ fontSize: 11, color: theme.textMuted }}>
            Reference Form • Click to view
          </Text>
        </View>
        
        <View style={styles.openIconWrap}>
          <ExternalLink size={16} color={theme.textMuted} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 16,
    borderRadius: 24,
    maxWidth: 300,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chipTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  openIconWrap: {
    marginLeft: 12,
    justifyContent: 'center',
  }
});
