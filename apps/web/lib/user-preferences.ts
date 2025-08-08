import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function updateUserLanguagePreference(language: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    
    const response = await axios.put(
      `${API_URL}/user/preferences`,
      { preferredLanguage: language },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating language preference:', error);
    throw error;
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