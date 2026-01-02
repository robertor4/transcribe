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

export async function updateUserProfile(profile: {
  displayName?: string;
  photoURL?: string;
}) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const token = await user.getIdToken();
    
    const response = await axios.put(
      `${API_URL}/user/profile`,
      profile,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function updateEmailNotifications(settings: {
  enabled?: boolean;
  onTranscriptionComplete?: boolean;
  digest?: 'immediate' | 'daily' | 'weekly';
}) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    const token = await user.getIdToken();

    const response = await axios.put(
      `${API_URL}/user/email-notifications`,
      settings,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error updating email notifications:', error);
    throw error;
  }
}

/**
 * Upload a profile photo file
 * @param file - The image file to upload (JPG/PNG, max 5MB)
 * @returns The URL of the uploaded photo
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }

  const token = await user.getIdToken();

  const formData = new FormData();
  formData.append('photo', file);

  const response = await axios.post(`${API_URL}/user/profile/photo`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.photoURL;
}

/**
 * Delete the current profile photo
 */
export async function deleteProfilePhoto(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }

  const token = await user.getIdToken();

  await axios.delete(`${API_URL}/user/profile/photo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}