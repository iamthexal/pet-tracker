// lib/storage.ts

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export async function uploadPetImage(file: File, userId: string): Promise<string> {
  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFilename = `pets/${userId}/${timestamp}-${file.name}`;
    const storageRef = ref(storage, uniqueFilename);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get and return the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function deletePetImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}