import React from 'react';
import { Cpu, Sparkles, FileText } from 'lucide-react-native';

export const MODELS = [
  {
    id: "version1",
    name: "RAG 1",
    description: "Advanced reasoning with graph mapping for complex analysis",
    iconName: "Sparkles",
  },
  {
    id: "version2",
    name: "RAG 2",
    description: "Fast & responsive, ideal for everyday legal search",
    iconName: "Cpu",
  },
  {
    id: "msme",
    name: "MSME Form",
    description: "Extract and auto-fill MSME related forms",
    iconName: "FileText",
  },
] as const;

export const MODEL_ICONS: { [key: string]: React.ComponentType<any> } = {
  Cpu,
  Sparkles,
  FileText,
};

export type ModelId = typeof MODELS[number]['id'];
