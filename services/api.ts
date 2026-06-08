import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Leave this empty unless using a public tunnel (like ngrok/cloudflare) for the app
const BACKEND_TUNNEL_URL = 'https://beam-needed-set-psychological.trycloudflare.com';

// On Web (Desktop), use localhost. On Mobile, use the PC's local Wi-Fi IP.
export let API_BASE_URL = BACKEND_TUNNEL_URL || (Platform.OS === 'web' ? 'http://192.168.29.205:8001' : 'http://192.168.29.205:8001');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const TUNNEL_STORAGE_KEY = 'lexai_tunnel_url';

export const setTunnelUrl = async (url: string) => {
  await AsyncStorage.setItem(TUNNEL_STORAGE_KEY, url);
  API_BASE_URL = url;
  api.defaults.baseURL = url;
  STREAM_CHAT_URL = `${url}/chat/stream`;
};

export const loadTunnelUrl = async (): Promise<string | null> => {
  const url = await AsyncStorage.getItem(TUNNEL_STORAGE_KEY);
  if (url) {
    API_BASE_URL = url;
    api.defaults.baseURL = url;
    STREAM_CHAT_URL = `${url}/chat/stream`;
    return url;
  }
  return null;
};

export const checkServerConnection = async (url: string): Promise<boolean> => {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    // Ping root instead of /stats to avoid 500s on specific routes
    await axios.get(`${cleanUrl}/`, { timeout: 10000 });
    return true;
  } catch (error: any) {
    if (error.response) {
      // Cloudflare tunnel down errors
      const status = error.response.status;
      if ([502, 522, 524, 530].includes(status)) {
        return false;
      }
      // Any other error (404, 500, 422, 401) means the backend is reachable!
      return true;
    }
    
    // On Web, CORS might cause a Network Error even if the server is up
    if (Platform.OS === 'web') {
      return url.trim().startsWith('http');
    }
    
    return false;
  }
};

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
  });
  return response.data;
};

// For chat streaming, we'll use react-native-sse directly in the component, 
// but we can export the URL here.
export let STREAM_CHAT_URL = `${API_BASE_URL}/chat/stream`;

export const deleteDocument = async (fileName: string, ragVersion: string = "version1"): Promise<any> => {
  const response = await api.delete(`/documents/${encodeURIComponent(fileName)}?rag_version=${encodeURIComponent(ragVersion)}`);
  return response.data;
};

export const clearAllDocuments = async (ragVersion: string = "version1"): Promise<any> => {
  const response = await api.delete(`/documents?rag_version=${encodeURIComponent(ragVersion)}`);
  return response.data;
};

export const getQueryTrace = async (ragVersion: string = "version1"): Promise<any> => {
  const response = await api.get(`/query_trace?rag_version=${encodeURIComponent(ragVersion)}`);
  return response.data;
};

export default api;
