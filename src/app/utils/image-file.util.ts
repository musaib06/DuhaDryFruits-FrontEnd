/**
 * Broad image extension support — phones, cameras, and design tools use many variants.
 */
const IMAGE_EXTENSION_PATTERN =
  /\.(jpe?g|jpe|jfif|pjpeg|png|gif|webp|heic|heif|avif|bmp|tiff?|tif|svg|ico|raw|cr2|nef|dng|arw|rw2|raf|orf|sr2|psd|ai|eps|x3f)$/i;

/** Match backend limit — allow large phone/camera originals; server compresses to WebP. */
export const MAX_IMAGE_UPLOAD_BYTES = 50 * 1024 * 1024;

/**
 * Accept any reasonable image file. MIME is unreliable on Windows/iPhone (empty, octet-stream, image/jpg).
 */
export function isAcceptedImageFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase().trim();
  const name = file.name || '';

  if (mime.startsWith('image/')) return true;
  if (IMAGE_EXTENSION_PATTERN.test(name)) return true;
  if ((!mime || mime === 'application/octet-stream') && IMAGE_EXTENSION_PATTERN.test(name)) {
    return true;
  }
  return false;
}

export function isImageFileTooLarge(file: File): boolean {
  return file.size > MAX_IMAGE_UPLOAD_BYTES;
}

export function maxImageUploadSizeLabel(): string {
  return `${Math.round(MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024))}MB`;
}

export function acceptedImageFileMessage(): string {
  return `Please choose an image file (JPG, PNG, GIF, WebP, HEIC, and other common formats, max ${maxImageUploadSizeLabel()})`;
}

export function acceptedImageFormatsLabel(): string {
  return 'all common image formats (JPG, JPEG, PNG, GIF, WebP, HEIC, HEIF, AVIF, BMP, TIFF, etc.)';
}

/** Browsers cannot render HEIC/HEIF in <img> — show a placeholder until upload. */
export function isHeicOrHeifFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  if (mime === 'image/heic' || mime === 'image/heif') return true;
  return /\.hei[cf]$/i.test(file.name || '');
}

/** Whether the browser can show a local thumbnail before upload. */
export function canPreviewImageFileInBrowser(file: File): boolean {
  if (isHeicOrHeifFile(file)) return false;
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('image/') && mime !== 'image/svg+xml') return true;
  return /\.(jpe?g|jpe|jfif|png|gif|webp|bmp|avif)$/i.test(file.name || '');
}
