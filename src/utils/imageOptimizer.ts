/**
 * Utility to optimize and convert uploaded images (logos, avatars, stamps)
 * to high-performance, crisp WebP/PNG formats with size constraints.
 * 
 * - Preserves transparency
 * - Cleans and resizes to optimal maximum dimensions
 * - Compresses to lightweight file size for lightning-fast page loads
 */

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/webp' | 'image/png' | 'image/jpeg';
}

export const optimizeImageFile = async (
  file: File,
  options: OptimizeOptions = {}
): Promise<File> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.9,
    format = 'image/webp'
  } = options;

  // If already SVG, no need to rasterize/compress
  if (file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimal format (default: webp or png if webp not supported)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const optimizedFile = new File([blob], `${baseName}_opt.${ext}`, {
              type: format,
              lastModified: Date.now()
            });

            resolve(optimizedFile);
          },
          format,
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};
