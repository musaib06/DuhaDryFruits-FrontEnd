/** TransferState keys — must match between server render and browser hydration. */
export const SSR_TRANSFER_KEYS = {
  HOME_PAGE: 'home-page-data',
  STOREFRONT_CATEGORIES: 'storefront-categories',
  STOREFRONT_BANNERS: 'storefront-banners',
  STOREFRONT_VIDEOS: 'storefront-videos-1-100',
  PRODUCT_NAMES: 'product-names-only',
  BEST_SELLERS: 'best-sellers',
  NEW_ARRIVALS: 'new-arrivals',
  HOME_PRODUCTS: 'home-products-8',
  STOREFRONT_TESTIMONIALS: 'storefront-testimonials',
  BLOG_NAV_COUNT: 'blog-nav-count',
} as const;

export const ssrProductDetailKey = (id: number) => `product-detail:${id}`;
export const ssrProductReviewsKey = (id: number) => `product-reviews:${id}`;
export const ssrProductFaqsKey = (id: number) => `product-faqs:${id}`;
export const ssrCategoryProductsKey = (categoryId: number, skip: number, top: number) =>
  `product-category:${categoryId}:${skip}:${top}`;
