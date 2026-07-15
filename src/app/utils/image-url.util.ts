import { environment } from '../../environments/environment';

const DEFAULT_PRODUCT_IMAGE = 'assets/logo.png';
const DEFAULT_BLOG_IMAGE = 'assets/placeholder-blog.jpg';

/** Absolute API origin, e.g. https://api.wildvalleyfoods.in */
export function apiOrigin(): string {
  return (environment.apiBaseUrl || '').replace(/\/$/, '');
}

/**
 * Resolve any image reference (URL, API path, legacy base64, or filesystem path) to a browser src.
 */
export function resolveImageUrl(
  src?: string | null,
  fallback: string = DEFAULT_PRODUCT_IMAGE,
): string {
  if (!src) return fallback;
  const value = String(src).trim();
  if (!value) return fallback;

  if (value.startsWith('data:') || /^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('/api/')) {
    return `${apiOrigin()}${value}`;
  }

  if (value.startsWith('api/')) {
    return `${apiOrigin()}/${value}`;
  }

  // Legacy absolute filesystem paths from old API payloads
  if (value.includes('uploads/')) {
    const uploadsIdx = value.indexOf('uploads/');
    const relative = value.slice(uploadsIdx);
    return `${apiOrigin()}/${relative}`;
  }

  if (value.startsWith('/')) {
    return `${apiOrigin()}${value}`;
  }

  return `${apiOrigin()}/${value.replace(/^\//, '')}`;
}

export function productShareImageUrl(
  productId: number,
  options?: { variantId?: number; imageId?: number },
): string {
  const base = `${apiOrigin()}/api/v1/product/image/${productId}`;
  const params: string[] = [];
  if (options?.imageId) params.push(`image=${options.imageId}`);
  else if (options?.variantId) params.push(`variant=${options.variantId}`);
  return params.length ? `${base}?${params.join('&')}` : base;
}

/** Strip only ?variant= fallback URLs; keep ?image= for cache-busting and primary row. */
export function normalizeProductListImageUrl(
  url: string | null | undefined,
  productId?: number,
): string | null {
  if (!url || !productId) return url ?? null;
  const value = String(url).trim();
  if (!value) return null;

  try {
    const parsed = new URL(value, apiOrigin());
    const match = parsed.pathname.match(/\/api\/v1\/product\/image\/(\d+)/);
    if (match && parsed.searchParams.has('variant') && !parsed.searchParams.has('image')) {
      return productShareImageUrl(productId);
    }
  } catch {
    /* keep original */
  }

  return value;
}

export function categoryIconUrl(categoryId: number): string {
  return `${apiOrigin()}/api/v1/category/icon/${categoryId}`;
}

export function bannerImageUrl(bannerId: number): string {
  return `${apiOrigin()}/api/v1/banner/image/${bannerId}`;
}

export function blogFeatureImageUrl(blogId: number): string {
  return `${apiOrigin()}/api/v1/blog/image/${blogId}/feature`;
}

type ProductImageLike =
  | string
  | { id?: number; src?: string; imagePath?: string; imageUrl?: string };
type VariantImageLike = {
  id?: number;
  variantImage?: string;
  variantImagePath?: string;
  variantImages?: Array<{ src?: string; imageUrl?: string; imagePath?: string }>;
};

/** True only when the variant has its own uploaded image(s), not an API fallback URL. */
export function variantHasDedicatedImage(variant?: VariantImageLike | null): boolean {
  if (!variant) return false;
  if (Array.isArray(variant.variantImages) && variant.variantImages.length > 0) {
    return true;
  }
  const path = String(variant.variantImagePath || '').trim();
  if (path && !/^https?:\/\//i.test(path) && path.includes('uploads/')) {
    return true;
  }
  const img = String(variant.variantImage || '').trim();
  if (img.startsWith('data:image/')) {
    return true;
  }
  return false;
}

/** Resolve selected variant from product payload (cart, wishlist, search, etc.). */
export function resolveSelectedVariantForImage(product: {
  selectedVariant?: VariantImageLike;
  selectedVariantId?: number;
  variants?: VariantImageLike[];
} | null | undefined): VariantImageLike | undefined {
  if (!product) return undefined;
  if (product.selectedVariant) return product.selectedVariant;
  const variants = product.variants;
  if (!variants?.length) return undefined;
  if (product.selectedVariantId) {
    const found = variants.find((v) => v.id === product.selectedVariantId);
    if (found) return found;
  }
  const def = variants.find((v: any) => v.isDefaultVariant);
  return def ?? variants[0];
}

function resolveProductImageEntry(
  raw: ProductImageLike | null | undefined,
  productId?: number,
  fallback: string = DEFAULT_PRODUCT_IMAGE,
): string {
  if (!raw) {
    return productId ? productShareImageUrl(productId) : fallback;
  }

  if (typeof raw === 'string') {
    const normalized = normalizeProductListImageUrl(raw, productId);
    return resolveImageUrl(normalized ?? raw, fallback);
  }

  const apiUrl = raw.src || raw.imageUrl;
  if (apiUrl) {
    const normalized = normalizeProductListImageUrl(apiUrl, productId);
    return resolveImageUrl(normalized ?? apiUrl, fallback);
  }

  const rowId = (raw as { id?: number }).id;
  if (productId) {
    return rowId
      ? productShareImageUrl(productId, { imageId: rowId })
      : productShareImageUrl(productId);
  }
  return fallback;
}

/** Pick the best image src from a product-like object (all end-user surfaces). */
export function resolveProductImage(
  product: {
    id?: number;
    images?: Array<ProductImageLike>;
    selectedVariantId?: number;
    selectedVariant?: VariantImageLike;
    variants?: VariantImageLike[];
  } | null | undefined,
  fallback: string = DEFAULT_PRODUCT_IMAGE,
): string {
  if (!product) return fallback;

  const productId = product.id;
  const productLevelSrc = () => {
    const raw = product.images?.[0];
    if (raw) return resolveProductImageEntry(raw, productId, fallback);
    return productId ? productShareImageUrl(productId) : fallback;
  };

  const variant = resolveSelectedVariantForImage(product);
  if (!variantHasDedicatedImage(variant)) {
    return productLevelSrc();
  }

  const variantImg =
    variant?.variantImages?.[0] ||
    (variant?.variantImagePath && !/^https?:\/\//i.test(variant.variantImagePath)
      ? { src: variant.variantImagePath }
      : null) ||
    (variant?.variantImage ? { src: variant.variantImage } : null);

  if (variantImg) {
    return resolveProductImageEntry(variantImg as ProductImageLike, productId, productLevelSrc());
  }

  return productLevelSrc();
}

/**
 * On <img> error: retry product-level image before logo placeholder.
 * Use on every end-user product thumbnail.
 */
export function handleProductImageError(
  event: Event,
  productId?: number,
  fallback: string = DEFAULT_PRODUCT_IMAGE,
  imageId?: number,
): void {
  const img = event.target as HTMLImageElement | null;
  if (!img || !productId) {
    if (img) img.src = fallback;
    return;
  }

  const failed = img.src || '';

  // Retry without variant param — use product-level primary image.
  if (failed.includes('variant=')) {
    const productUrl = productShareImageUrl(productId, imageId ? { imageId } : undefined);
    if (img.src !== productUrl) {
      img.src = productUrl;
      return;
    }
  }

  // Retry canonical product URL without query if a specific image id failed.
  if (failed.includes('image=')) {
    const bare = productShareImageUrl(productId);
    if (img.src !== bare) {
      img.src = bare;
      return;
    }
  }

  if (!failed.includes(`/product/image/${productId}`)) {
    const productUrl = productShareImageUrl(productId, imageId ? { imageId } : undefined);
    if (img.src !== productUrl) {
      img.src = productUrl;
      return;
    }
  }

  img.src = fallback;
}

export function resolveCategoryIcon(
  category: { id?: number; category_icon?: string; category_icon_url?: string; category_icon_base64?: string } | null | undefined,
  fallback: string = DEFAULT_PRODUCT_IMAGE,
): string {
  if (!category) return fallback;
  if (category.category_icon_url) return resolveImageUrl(category.category_icon_url, fallback);
  if (category.category_icon) return resolveImageUrl(category.category_icon, fallback);
  if (category.category_icon_base64) return resolveImageUrl(category.category_icon_base64, fallback);
  if (category.id) return categoryIconUrl(category.id);
  return fallback;
}

export function resolveBannerImage(
  banner: { id?: number; imageUrl?: string; imagePath?: string; image_base64?: string } | null | undefined,
  fallback: string = DEFAULT_PRODUCT_IMAGE,
): string {
  if (!banner) return fallback;
  if (banner.imageUrl) return resolveImageUrl(banner.imageUrl, fallback);
  if (banner.imagePath) return resolveImageUrl(banner.imagePath, fallback);
  if (banner.image_base64) return resolveImageUrl(banner.image_base64, fallback);
  if (banner.id) return bannerImageUrl(banner.id);
  return fallback;
}

export function resolveBlogFeatureImage(
  blog: { id?: number; featureImageUrl?: string; featureImage?: string; featureImageBase64?: string } | null | undefined,
  fallback: string = DEFAULT_BLOG_IMAGE,
): string {
  if (!blog) return fallback;
  if (blog.featureImageUrl) return resolveImageUrl(blog.featureImageUrl, fallback);
  if (blog.featureImage) return resolveImageUrl(blog.featureImage, fallback);
  if (blog.featureImageBase64) return resolveImageUrl(blog.featureImageBase64, fallback);
  if (blog.id) return blogFeatureImageUrl(blog.id);
  return fallback;
}

export function resolveBlogMedia(
  media: { id?: number; url?: string; filePath?: string; fileBase64?: string } | null | undefined,
  fallback: string = DEFAULT_BLOG_IMAGE,
): string {
  if (!media) return fallback;
  if (media.url) return resolveImageUrl(media.url, fallback);
  if (media.filePath) return resolveImageUrl(media.filePath, fallback);
  if (media.fileBase64) return resolveImageUrl(media.fileBase64, fallback);
  if (media.id) return `${apiOrigin()}/api/v1/blog/media/${media.id}`;
  return fallback;
}
