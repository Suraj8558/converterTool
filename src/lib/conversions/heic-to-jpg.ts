export async function heicToJpg(file: File): Promise<Blob> {
  const { default: heic2any } = await import('heic2any');
  try {
    const output = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    return Array.isArray(output) ? output[0] : output;
  } catch {
    // The library rejects with plain objects, not Errors.
    throw new Error(`"${file.name}" could not be read as a HEIC image.`);
  }
}
