import { DEPRECATED_FEST_MODEL_IMAGES, festModelImageUrl } from "./brand";
import {
  FEST_CART_MODELS,
  FEST_TEMPLATES,
  ICE_CREAM_LINES,
  LOSLOS_STORES_MOCK,
} from "./mock-data";
import type { FestTemplate, HomeImages, IceCreamLine, LoslosStore } from "./types";

export const LOSLOS_ADMIN_CATALOG_KEY = "loslos_fest_admin_catalog_v1";
export const LOSLOS_CATALOG_CHANGED_EVENT = "loslos-fest-catalog-changed";

const CATALOG_VERSION = 5 as const;

/** Slides padrão do carrossel do hero na home (fallback quando não editado). */
export const HOME_IMAGE_DEFAULTS: HomeImages = {
  heroSlides: [
    { src: "/loslos/carousel-01.png", alt: "Los Los Fest — evento" },
    { src: "/loslos/carousel-02.png", alt: "Los Los Fest — carrinho em festa" },
    { src: "/loslos/carousel-03.png", alt: "Los Los Fest — sorvetes no evento" },
  ],
};

function seedHomeImages(): HomeImages {
  return { heroSlides: HOME_IMAGE_DEFAULTS.heroSlides.map((s) => ({ ...s })) };
}

export type AdminCatalog = {
  version: typeof CATALOG_VERSION;
  lines: IceCreamLine[];
  templates: FestTemplate[];
  stores: LoslosStore[];
  homeImages: HomeImages;
  updatedAt: string;
};

function seedCatalog(): AdminCatalog {
  return {
    version: CATALOG_VERSION,
    lines: ICE_CREAM_LINES.map((l) => ({ ...l })),
    templates: FEST_TEMPLATES.map((t) => ({ ...t, lines: [...t.lines] })),
    stores: LOSLOS_STORES_MOCK.map((s) => ({ ...s })),
    homeImages: seedHomeImages(),
    updatedAt: new Date().toISOString(),
  };
}

export function getSeedCatalog(): AdminCatalog {
  return seedCatalog();
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function emitCatalogChanged() {
  if (isBrowser())
    window.dispatchEvent(new Event(LOSLOS_CATALOG_CHANGED_EVENT));
}

function usesLinePackagingImage(url: string): boolean {
  return url.startsWith("/loslos/") || url.includes("/lines/");
}

function migrateCatalog(catalog: AdminCatalog): AdminCatalog {
  const hasHomeImages =
    !!catalog.homeImages &&
    Array.isArray(catalog.homeImages.heroSlides) &&
    catalog.homeImages.heroSlides.length > 0;

  if (catalog.version === CATALOG_VERSION && hasHomeImages) return catalog;

  const templates = catalog.templates.map((t) => {
    const shouldRefresh =
      usesLinePackagingImage(t.imageUrl) ||
      DEPRECATED_FEST_MODEL_IMAGES.has(t.imageUrl);
    if (!shouldRefresh) return t;
    return {
      ...t,
      imageUrl: festModelImageUrl(t.occasion, t.slug),
    };
  });

  return {
    ...catalog,
    version: CATALOG_VERSION,
    templates,
    homeImages: hasHomeImages ? catalog.homeImages : seedHomeImages(),
    updatedAt: new Date().toISOString(),
  };
}

function parse(raw: string | null): AdminCatalog | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as AdminCatalog;
    if (
      !Array.isArray(v.lines) ||
      !Array.isArray(v.templates) ||
      !Array.isArray(v.stores)
    ) {
      return null;
    }
    if (
      v.version !== CATALOG_VERSION &&
      v.version !== 2 &&
      v.version !== 3 &&
      v.version !== 4
    )
      return null;
    return migrateCatalog(v);
  } catch {
    return null;
  }
}

/** Lê catálogo do localStorage ou retorna seed (apenas no browser). */
export function readAdminCatalog(): AdminCatalog {
  if (!isBrowser()) return seedCatalog();
  const raw = localStorage.getItem(LOSLOS_ADMIN_CATALOG_KEY);
  const stored = parse(raw);
  if (stored) {
    if (raw) {
      try {
        const previous = JSON.parse(raw) as AdminCatalog;
        if (previous.version !== stored.version) writeAdminCatalog(stored);
      } catch {
        /* ignora JSON inválido */
      }
    }
    return stored;
  }
  return seedCatalog();
}

export function writeAdminCatalog(catalog: AdminCatalog): void {
  if (!isBrowser()) return;
  const next: AdminCatalog = {
    ...catalog,
    version: CATALOG_VERSION,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOSLOS_ADMIN_CATALOG_KEY, JSON.stringify(next));
  emitCatalogChanged();
}

export function resetAdminCatalogToSeed(): void {
  if (!isBrowser()) return;
  writeAdminCatalog(seedCatalog());
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function newLineId(): string {
  return `line-${Date.now().toString(36)}`;
}

export function newTemplateId(): string {
  return `tpl-${Date.now().toString(36)}`;
}

export function newStoreId(): string {
  return `store-${Date.now().toString(36)}`;
}

/** Carrinhos fixos no mock — só linhas, modelos e filiais são editáveis. */
export const ADMIN_CART_MODELS = FEST_CART_MODELS;
