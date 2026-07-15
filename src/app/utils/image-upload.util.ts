/** Turn a prepared image blob from the API into a File ready for product FormData upload. */
export function blobToImageFile(blob: Blob, originalName: string): File {
  const mime = blob.type || 'image/webp';
  let ext = '.webp';
  if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
  else if (mime.includes('png')) ext = '.png';
  const name = originalName.replace(/\.[^.\\/]+$/i, ext);
  return new File([blob], name, { type: mime, lastModified: Date.now() });
}

export function revokeBlobUrl(url?: string | null): void {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
