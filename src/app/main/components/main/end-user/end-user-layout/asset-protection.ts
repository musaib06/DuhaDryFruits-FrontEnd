/** Image nodes we treat as protected catalog / product / promo media */
export function closestProtectedAssetImage(target: EventTarget | null): HTMLImageElement | null {
  const el = target as Node | null;
  if (!el) return null;
  const asElement = el.nodeType === Node.ELEMENT_NODE ? (el as Element) : el.parentElement;
  const img = asElement?.closest?.('img.duha-protect-asset');
  return img instanceof HTMLImageElement ? img : null;
}
