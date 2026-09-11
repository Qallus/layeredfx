import { services } from './content';
export const serviceSlug = (name: string) => name.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-');
const descriptions = [
 'Bring scale, color and identity to a room with wall graphics and architectural wraps. Explore a quiet texture, a bold mural or a branded environment.',
 'Give existing cabinetry a new surface direction. We review doors, edges, hardware and substrate condition before choosing an appropriate architectural film.',
 'Explore a new look for an existing countertop. Heat, moisture, food contact and daily wear all matter when deciding whether a wrap suits the application.',
 'Coordinate visible appliance surfaces with the rest of your space. Clearances, ventilation and manufacturer requirements guide material selection.',
 'Create rhythm and character with wallpaper. Pattern repeats, seams, wall preparation and room lighting shape a considered installation.',
 'Bring soft movement and mineral depth to walls with Roman clay. Sample boards help you evaluate texture and tone in the light of your own room.',
 'Explore a concrete-inspired finish with a decorative overlay. We assess the base surface and desired texture before defining preparation and scope.',
 'Balance daylight, privacy and design with window film. Glazing compatibility and the selected product determine the suitable application.',
 'Refresh a room through color, sheen and careful preparation. We consider the existing finish, repairs, trim and how you use the space.',
 'Give exterior surfaces a considered new finish. Substrate condition, exposure, access and preparation determine the project approach.',
];
export const servicePages = services.map((name,i)=>({name,slug:serviceSlug(name),description:descriptions[i],image:i<4?'/images/kitchen.svg':i<7?'/images/architectural-room.svg':i===7?'/images/glass.svg':'/images/paint.svg'}));
