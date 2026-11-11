import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

export const storageService = {
  uploadFile: async (
    file: File,
    folderPath: string,
    onProgress?: UploadProgressCallback
  ): Promise<string> => {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `${folderPath}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: any) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error: any) => {
            console.warn('Storage upload note (falling back to object URL):', error);
            // Fallback for local preview if Storage bucket requires auth token or is blocked
            const localPreviewUrl = URL.createObjectURL(file);
            resolve(localPreviewUrl);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          }
        );
      });
    } catch (err) {
      console.warn('Storage service exception:', err);
      return URL.createObjectURL(file);
    }
  },

  deleteFile: async (fileUrlOrPath: string): Promise<void> => {
    if (
      !fileUrlOrPath ||
      fileUrlOrPath.startsWith('blob:') ||
      fileUrlOrPath.includes('unsplash.com') ||
      fileUrlOrPath.includes('image.tmdb.org') ||
      (!fileUrlOrPath.includes('firebasestorage.googleapis.com') && fileUrlOrPath.startsWith('http'))
    ) {
      return;
    }
    try {
      const storageRef = ref(storage, fileUrlOrPath);
      await deleteObject(storageRef);
    } catch (e) {
      console.warn('Storage file deletion note:', e);
    }
  }
};
