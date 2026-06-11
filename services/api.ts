import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Leave this empty unless using a public tunnel (like ngrok/cloudflare) for the app
// NOTE: Cloudflare quick tunnels often block CORS preflight (OPTIONS) requests.
// Use empty string '' for local development, or set to tunnel URL for mobile testing.
const BACKEND_TUNNEL_URL = 'https://camcorder-utc-kiss-suggestion.trycloudflare.com';

// On Web (Desktop), use 127.0.0.1. On Mobile, use the PC's local Wi-Fi IP.
export const API_BASE_URL = BACKEND_TUNNEL_URL || (Platform.OS === 'web' ? 'http://127.0.0.1:8001' : 'http://192.168.29.205:8001');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Auth Persistence ---
const AUTH_STORAGE_KEY = 'lexai_auth';

export interface AuthData {
  user_id: string;
  username: string;
}

export const saveAuth = async (data: AuthData): Promise<void> => {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
};

export const loadAuth = async (): Promise<AuthData | null> => {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthData;
  } catch {
    return null;
  }
};

export const clearAuth = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
};

export interface Session {
  id: string;
  title: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export const getSessions = async (userId: string = 'default_user'): Promise<Session[]> => {
  const response = await api.get('/sessions', { params: { user_id: userId } });
  return response.data;
};

export const getSessionHistory = async (sessionId: string): Promise<{ session_id: string; messages: ChatMessage[] }> => {
  const response = await api.get(`/sessions/${sessionId}/history`);
  return response.data;
};

export const renameSession = async (sessionId: string, title: string): Promise<any> => {
  const response = await api.patch(`/sessions/${sessionId}/title`, { title });
  return response.data;
};

export const deleteSession = async (sessionId: string): Promise<any> => {
  const response = await api.delete(`/sessions/${sessionId}`);
  return response.data;
};

export const register = async (username: string, email: string, password: string): Promise<any> => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

export const login = async (username: string, password: string): Promise<any> => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const uploadDocument = async (fileUri: string, fileName: string, mimeType: string, buildGraph: boolean = false): Promise<any> => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On Web, fetch the blob URL and convert it to a standard browser File object
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: mimeType || 'application/octet-stream' });
    formData.append('file', file);
  } else {
    // On Native (Android/iOS), append the React Native file object wrapper
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType || 'application/octet-stream',
    } as any);
  }

  formData.append('buildGraph', String(buildGraph));

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 15 * 60 * 1000, // keep high timeout just in case it's a huge file
  });

  let result = response.data;

  // Background polling mechanism if the backend returns a task_id
  if (result.status === 'processing' && result.task_id) {
    while (true) {
      // Wait 5 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 5000));

      try {
        const statusRes = await api.get(`/upload/status/${result.task_id}`);
        const currentStatus = statusRes.data.status;

        if (currentStatus !== 'processing') {
          // Task has finished (success, failed, or already_exists)
          return statusRes.data;
        }
      } catch (err) {
        console.warn("Polling error (will retry):", err);
      }
    }
  }

  return result;
};

// For chat streaming, we'll use react-native-sse directly in the component, 
// but we can export the URL here.
export const STREAM_CHAT_URL = `${API_BASE_URL}/chat/stream`;

export const deleteDocument = async (fileName: string, ragVersion: string = "version1"): Promise<any> => {
  const response = await api.delete(`/documents/${encodeURIComponent(fileName)}?rag_version=${encodeURIComponent(ragVersion)}`);
  return response.data;
};

export const clearAllDocuments = async (ragVersion: string = "version1"): Promise<any> => {
  const response = await api.delete(`/documents?rag_version=${encodeURIComponent(ragVersion)}`);
  return response.data;
};

export const getDocumentContent = async (fileName: string, ragVersion: string = "version1"): Promise<any> => {
  const response = await api.get(`/documents/${encodeURIComponent(fileName)}/content?rag_version=${encodeURIComponent(ragVersion)}`);
  return response.data;
};

export const updateDocumentContent = async (fileName: string, content: string, ragVersion: string = "version1"): Promise<any> => {
  const response = await api.put(`/documents/${encodeURIComponent(fileName)}/content?rag_version=${encodeURIComponent(ragVersion)}`, { content });
  return response.data;
};

export const searchDocuments = async (query: string, ragVersion: string = "version1"): Promise<any> => {
  const response = await api.get(`/documents/search?q=${encodeURIComponent(query)}&rag_version=${encodeURIComponent(ragVersion)}`);
  return response.data;
};

export const getQueryTrace = async (ragVersion: string = "version1"): Promise<any> => {
  const response = await api.get(`/query_trace?rag_version=${encodeURIComponent(ragVersion)}`);
  return response.data;
};

export const previewParseDocument = async (fileUri: string, fileName: string, mimeType: string, ragVersion: string = "version1"): Promise<{ file_name: string; content: string }> => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: mimeType || 'application/octet-stream' });
    formData.append('file', file);
  } else {
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType || 'application/octet-stream',
    } as any);
  }

  const response = await api.post(`/documents/preview-parse?rag_version=${encodeURIComponent(ragVersion)}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 3 * 60 * 1000, // Parsing could take 1-2 mins
  });

  return response.data;
};

export const replaceDocument = async (fileUri: string, fileName: string, mimeType: string, oldFileName: string, ragVersion: string = "version1"): Promise<any> => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: mimeType || 'application/octet-stream' });
    formData.append('file', file);
  } else {
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType || 'application/octet-stream',
    } as any);
  }

  formData.append('old_file_name', oldFileName);

  const response = await api.post(`/documents/replace?rag_version=${encodeURIComponent(ragVersion)}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 10 * 60 * 1000, // Full parsing + chunking + embedding might take long
  });

  return response.data;
};

export default api;
