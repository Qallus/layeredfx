export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTOS = 4;
export const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export function validatePhoto(file) {
  if (!IMAGE_TYPES.has(file.type)) return "Choose JPG, PNG, or WebP photos.";
  if (file.size > MAX_PHOTO_BYTES) return "Each photo must be 8 MB or smaller.";
  return null;
}
export function validateContact(value) {
  const errors = {};
  if (!value.name?.trim()) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email?.trim() || "")) errors.email = "Enter a valid email address.";
  return errors;
}
