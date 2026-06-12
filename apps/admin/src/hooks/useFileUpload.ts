import { useState, useCallback } from 'react';
import { uploadPropertyImage } from '@/services/storage';

interface UploadedImage {
  url: string;
  path: string;
  file?: File;
  preview?: string;
}

export function useFileUpload(propertyId: string) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const addImages = useCallback(async (files: File[]) => {
    setUploading(true);
    const results: UploadedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      if (propertyId) {
        const result = await uploadPropertyImage(file, propertyId);
        if (result) results.push({ ...result, file, preview });
      } else {
        results.push({ url: preview, path: '', file, preview });
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setImages((prev) => [...prev, ...results]);
    setUploading(false);
    setProgress(0);
  }, [propertyId]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
  }, []);

  const setInitialImages = useCallback((imgs: UploadedImage[]) => {
    setImages(imgs);
  }, []);

  return { images, uploading, progress, addImages, removeImage, reorderImages, setInitialImages };
}
