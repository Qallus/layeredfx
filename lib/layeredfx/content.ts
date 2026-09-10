export const services = [
  "Wall wraps", "Cabinet wraps", "Countertop wraps", "Appliance wraps", "Wallpaper",
  "Roman clay", "Faux concrete overlays", "Window tint & film", "Interior painting", "Exterior painting",
] as const;
export type Service = (typeof services)[number];
export type FinishId = "clay" | "oak" | "stone" | "charcoal";
export const finishes: { id: FinishId; name: string; description: string; color: string; tag: string }[] = [
  { id: "clay", name: "Soft mineral", description: "Quiet texture. Warm, earthy character.", color: "#c8b399", tag: "Roman clay / finish inspiration" },
  { id: "oak", name: "Natural oak", description: "The warmth of wood. A new surface story.", color: "#aa7a4e", tag: "Architectural wrap / finish inspiration" },
  { id: "stone", name: "Pale limestone", description: "A little movement. A beautifully natural mood.", color: "#d1cec2", tag: "Stone-look wrap / finish inspiration" },
  { id: "charcoal", name: "Deep graphite", description: "A confident contrast. A considered statement.", color: "#52554e", tag: "Solid finish / color inspiration" },
];
export const serviceGroups = [
  { id: "wraps", number: "01", category: "wraps", title: "Wrap. Reimagine.", subtitle: "A different finish. A whole new perspective.", image: "/images/kitchen.svg", services: ["Wall wraps", "Cabinet wraps", "Countertop wraps", "Appliance wraps"] as Service[], detail: "Explore a fresh direction for walls, cabinets, countertops, and appliances. Surface condition and material suitability are reviewed before a recommendation or estimate." },
  { id: "finishes", number: "02", category: "finishes", title: "Make it tactile.", subtitle: "Depth, texture, and a little unexpected character.", image: "/images/architectural-room.svg", services: ["Wallpaper", "Roman clay", "Faux concrete overlays"] as Service[], detail: "Bring texture and character to a space through wallpaper, Roman clay, and decorative concrete-look finishes. Product selection and preparation depend on the application." },
  { id: "film", number: "03", category: "film-paint", title: "See light differently.", subtitle: "A more intentional relationship with glass.", image: "/images/glass.svg", services: ["Window tint & film"] as Service[], detail: "Explore window tint and film for residential and commercial glass. Privacy, decorative effects, and solar-control options depend on the selected product and glazing." },
  { id: "paint", number: "04", category: "film-paint", title: "Set a new tone.", subtitle: "The right color changes the entire conversation.", image: "/images/paint.svg", services: ["Interior painting", "Exterior painting"] as Service[], detail: "Create a new direction with interior or exterior painting. Color, existing conditions, preparation, and project access help shape your scope." },
];
export const inspiration = [
  { title: "A warmer welcome", kind: "residential", image: "/images/architectural-room.svg", description: "Soft texture · Natural tones", services: ["Roman clay", "Interior painting"] },
  { title: "A fresh perspective", kind: "residential", image: "/images/kitchen.svg", description: "Architectural wraps · Considered contrast", services: ["Cabinet wraps", "Countertop wraps"] },
  { title: "A space that speaks", kind: "commercial", image: "/images/glass.svg", description: "Privacy film · Branded environments", services: ["Window tint & film", "Wall wraps"] },
];
export const faqs = [
  { q: "Can you help me decide which finish is right?", a: "Start with the surface you want to change and the feeling you want to create. Your consultation can explore wraps, decorative finishes, film, and paint, with suitability assessed for the specific surface." },
  { q: "Do you work on homes and commercial spaces?", a: "Yes. LayeredFX provides residential and commercial surface, finishing, window film, and painting services. Share your project type and goals so the conversation starts in the right place." },
  { q: "What should I have ready for an estimate?", a: "A few photos, your project location, the surfaces you want to change, and an approximate timeline are a helpful start. Rough measurements are useful, but you do not need to have every detail figured out." },
  { q: "Is the online material preview an exact match?", a: "No. The material explorer is an illustrative concept. Screen color, lighting, scale, substrate, and the actual material can change the result. Final selections should be checked against real samples." },
];
