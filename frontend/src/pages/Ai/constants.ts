/** 24×24 线性图标，统一使用 currentColor，跟随明暗主题 */
function icon(paths: string): string {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

export const ICON_SVG_SPARK = icon(
  `<path d="M12 3.6l1.85 5.35L19.2 10.8l-5.35 1.85L12 18l-1.85-5.35L4.8 10.8l5.35-1.85z"/><path d="M18.4 15.4l.75 2.05 2.05.75-2.05.75-.75 2.05-.75-2.05-2.05-.75 2.05-.75z"/>`,
);

export const ICON_SVG_IMAGE = icon(
  `<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="8.8" cy="9.8" r="1.5"/><path d="M4.6 17.2l4-4a1.8 1.8 0 0 1 2.5 0l1.6 1.6"/><path d="M13.4 13.7l1.6-1.6a1.8 1.8 0 0 1 2.5 0l1.9 1.9"/>`,
);

export const ICON_SVG_DATA = icon(
  `<rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><path d="M3.5 9.4h17M3.5 14.4h17M9.2 4.5v15"/>`,
);

export const ICON_SVG_SEND = icon(
  `<path d="M21 3L10.6 13.4"/><path d="M21 3l-6.6 18-3.9-8-7.9-3.9z"/>`,
);

export const ICON_SVG_STOP = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="6.5" y="6.5" width="11" height="11" rx="2.2"/></svg>`;

export const ICON_SVG_PLUS = icon(`<path d="M12 5.5v13M5.5 12h13"/>`);

export const ICON_SVG_CLOSE = icon(
  `<path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8"/>`,
);

export const ICON_SVG_TRASH = icon(
  `<path d="M4.5 7h15"/><path d="M9.6 7V5.3A1.3 1.3 0 0 1 10.9 4h2.2a1.3 1.3 0 0 1 1.3 1.3V7"/><path d="M6.6 7l.75 11.8A2 2 0 0 0 9.35 20.6h5.3a2 2 0 0 0 2-1.8L17.4 7"/>`,
);

export const ICON_SVG_COPY = icon(
  `<rect x="9.2" y="9.2" width="10.8" height="10.8" rx="2.2"/><path d="M15 5.6A1.6 1.6 0 0 0 13.4 4H6.5A2.5 2.5 0 0 0 4 6.5v6.9A1.6 1.6 0 0 0 5.6 15"/>`,
);

export const ICON_SVG_CHECK = icon(`<path d="m5 12.4 4.6 4.6L19 7.4"/>`);

export const ICON_SVG_CHEVRON = icon(`<path d="m7 10 5 5 5-5"/>`);

export const ICON_SVG_RETRY = icon(
  `<path d="M20 12a8 8 0 1 1-2.35-5.65"/><path d="M20 4.6V10h-5.4"/>`,
);

export const ICON_SVG_MENU = icon(`<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>`);

export const EMPTY_STATE = {
  title: "Analyze your data with AI",
  hint: "Replies follow the language you ask in.",
} as const;

export const COMPOSER_PLACEHOLDER = "Ask anything about your data…";
