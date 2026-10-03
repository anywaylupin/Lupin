/** Stand-in line icons drawn on a 24 unit grid; no brand logos by design. */
export const ICON = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  folder: '<path d="M3 6h7l2 2h9v11H3z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  briefcase: '<path d="M3 8h18v12H3zM9 8V5h6v3M3 13h18"/>',
  pulse: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  back: '<path d="M10 6 4 12l6 6M4 12h16"/>',
  branch:
    '<circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="9" r="2.2"/><path d="M6 8.2v7.6M18 11.2c0 3.5-4 4-10.5 5.5"/>',
  cards: '<path d="M8 4h11v14H8z"/><path d="M5 7v13h11"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
  building: '<path d="M5 21V4h10v17M15 9h4v12M3 21h18M8 8h4M8 12h4M8 16h4"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  rise: '<path d="M3 17 9 11l4 4 8-8M15 7h6v6"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 11.5v1"/>',
  code: '<path d="M8 7 3 12l5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  server: '<path d="M4 4h16v6H4zM4 14h16v6H4zM8 7h1M8 17h1"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>',
  terminal: '<path d="M3 5h18v14H3zM7 10l3 2-3 2M12 15h5"/>',
  profile: '<path d="M3 5h18v14H3z"/><path d="M6.5 10h4v4h-4zM14 10h4.5M14 14h4.5"/>',
  mail: '<path d="M3 5.5h18v13H3z"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
  file: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 15.5h7M9 8.5h3"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><path d="M14 4.5h4v5h-4zM8 14.5h4v5H8z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
} as const satisfies Record<string, string>;

export type IconName = keyof typeof ICON;

/** `Object.keys` widens to string[]; the cast restores the literal union so Zod can validate icon names in content. */
export const ICON_NAMES = Object.keys(ICON) as [IconName, ...IconName[]];

export function svgIcon(name: IconName): string {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;
}
