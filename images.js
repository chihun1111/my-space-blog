export async function uploadRasterImage(file, messages) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || !file.size) throw new Error(messages.imageInvalid);
  if (file.size > 10 * 1024 * 1024) throw new Error(messages.imageTooLarge);
  const objectURL = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = () => reject(new Error(messages.imageUnreadable));
      image.src = objectURL;
    });
  } finally { URL.revokeObjectURL(objectURL); }
  const response = await fetch('./api/images', { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  let result;
  try { result = await response.json(); }
  catch { throw new Error(messages.responseError); }
  if (!response.ok) throw new Error(result.error || messages.validationError);
  return result.path;
}
