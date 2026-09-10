export const MAX_PHOTO_BYTES: number;
export const MAX_PHOTOS: number;
export const IMAGE_TYPES: Set<string>;
export function validatePhoto(file: { type: string; size: number }): string | null;
export function validateContact(value: { name: string; email: string }): { name?: string; email?: string };
