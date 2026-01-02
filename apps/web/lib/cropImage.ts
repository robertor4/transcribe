/**
 * Utility for cropping images using Canvas API
 * Used by the profile photo cropper to generate optimized output
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates a cropped and optimized image from the source
 * @param imageSrc - Data URL or blob URL of the source image
 * @param pixelCrop - Crop area in pixels from react-easy-crop
 * @param outputSize - Output dimensions (square, default 400px)
 * @param quality - JPEG quality 0-1 (default 0.85)
 * @returns Promise<File> - Optimized JPEG file
 */
export async function cropImage(
  imageSrc: string,
  pixelCrop: CropArea,
  outputSize: number = 400,
  quality: number = 0.85
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set canvas to output size
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw the cropped portion of the image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/jpeg',
      quality
    );
  });

  // Create File from blob
  const fileName = `profile-${Date.now()}.jpg`;
  return new File([blob], fileName, { type: 'image/jpeg' });
}

/**
 * Loads an image from a URL and returns an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = src;
  });
}

/**
 * Creates a data URL from a File object
 */
export function createImageUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
