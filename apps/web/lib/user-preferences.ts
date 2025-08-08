import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  } catch (error: any) {
    // If it's a network error, silently fail and just log
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
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