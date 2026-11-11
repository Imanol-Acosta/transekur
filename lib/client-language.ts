export const clientLanguageLabels = { es: "Spanish", en: "English" } as const;
export type ClientLanguage = keyof typeof clientLanguageLabels;
export const defaultClientLanguage = "es" satisfies ClientLanguage;
