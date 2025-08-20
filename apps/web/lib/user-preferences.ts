import axios from 'axios';
import { auth } from './firebase';
import { getApiUrl } from './config';

const API_URL = getApiUrl();

export async function updateUserLanguagePreference(language: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      // If no user, just save locally
      return;
    }

    const token = await user.getIdToken();
    
    const response = await axios.put(
      `${API_URL}/user/preferences`,
      { preferredLanguage: language },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000, // 5 second timeout
      }
    );

    return response.data;
  } catch (error) {
    // If it's a network error, silently fail and just log
    const err = error as { code?: string; message?: string };
    if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
      console.log('API not available, language preference saved locally only');
      return; // Don't throw, just return silently
    }
    console.error('Error updating language preference:', error);
    // Don't throw for language preference errors, as it's not critical
    return;
  }
}

export async function getUserProfile() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    const token = await user.getIdToken();
    
    const response = await axios.get(`${API_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}