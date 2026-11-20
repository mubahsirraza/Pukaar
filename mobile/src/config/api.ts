import { Platform } from 'react-native';

const LOCAL_API_URL = Platform.OS === 'web'
  ? 'http://localhost:5000/api'
  : 'http://10.170.40.13:5000/api';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || LOCAL_API_URL;
