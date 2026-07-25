/**
 * SEO-friendly end-user route paths (kebab-case, keyword-aware).
 * Use these constants for navigate()/routerLink to keep URLs consistent under SSR.
 */
export const EndUserPaths = {
  home: '',
  shop: 'buy-dry-fruits',
  product: 'dry-fruits',
  cart: 'shopping-cart',
  checkout: 'checkout',
  wishlist: 'saved-items',
  orders: 'order-history',
  contact: 'contact',
  health: 'dry-fruits-for-health',
  about: 'about-duha',
  privacy: 'privacy-policy',
  terms: 'terms-and-conditions',
  returns: 'returns-and-refunds',
  journal: 'journal',
  paymentSuccess: 'payment/success',
  paymentFailure: 'payment/failure',
  wholesale: 'wholesale-dry-fruits',
  myWholesale: 'my-wholesale-requests',
} as const;

/** Absolute path helpers (leading slash). */
export const EndUserUrl = {
  home: '/',
  shop: `/${EndUserPaths.shop}`,
  product: (slug: string) => `/${EndUserPaths.product}/${slug}`,
  shopCategory: (name: string, id: string | number) =>
    `/${EndUserPaths.shop}/${encodeURIComponent(name)}/${id}`,
  cart: `/${EndUserPaths.cart}`,
  checkout: `/${EndUserPaths.checkout}`,
  wishlist: `/${EndUserPaths.wishlist}`,
  orders: `/${EndUserPaths.orders}`,
  contact: `/${EndUserPaths.contact}`,
  health: `/${EndUserPaths.health}`,
  about: `/${EndUserPaths.about}`,
  privacy: `/${EndUserPaths.privacy}`,
  terms: `/${EndUserPaths.terms}`,
  returns: `/${EndUserPaths.returns}`,
  journal: `/${EndUserPaths.journal}`,
  journalArticle: (slug: string) => `/${EndUserPaths.journal}/${slug}`,
  paymentSuccess: `/${EndUserPaths.paymentSuccess}`,
  paymentFailure: `/${EndUserPaths.paymentFailure}`,
  wholesale: `/${EndUserPaths.wholesale}`,
  myWholesale: `/${EndUserPaths.myWholesale}`,
} as const;
