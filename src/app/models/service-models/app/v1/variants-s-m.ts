import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";

/**
 * Product Variant Service Model
 * Represents a product variant with unit-based pricing
 * 
 * REFACTOR: Updated to match new data model where:
 * - Price lives on variant (not product)
 * - unitId references Unit dropdown (NOT unitValueId)
 * - unitName and unitSymbol are denormalized for easy access
 * - Includes order quantity constraints and stock management
 */
export class ProductVariantSM extends DuhaDryFruitsServiceModelBase<number> {
  productId!: number;
  unitId?: number;              // selected from Unit dropdown (maps to unitValueId from backend)
  unitName?: string;            // denormalized from Unit (from unitValue.name)
  unitSymbol?: string;          // denormalized from Unit (from unitValue.symbol or name)
  quantity!: number;            // e.g., 1, 500, 250
  price!: number;               // variant price (moved from product)
  comparePrice?: number;        // variant compare price (moved from product)
  sku!: string;                 // auto-generated: PRODUCTCODE-<QTY><UNIT>
  barcode?: string;
  stock!: number;               // variant stock
  displayUnit?: string;         // API: "{pack size} {unitSymbol}" (presentation only)
  weight?: number | null;       // pack size value (combined with unit symbol for storefront display)
  minOrderQuantity?: number;    // minimum quantity for order (default: 1)
  maxOrderQuantity?: number;    // maximum quantity for order (null = unlimited)
  isDefaultVariant!: boolean;   // only one default variant per product
  isActive?: boolean;           // variant active status (default: true)
  
  // Variant-specific fields
  variantImage?: string;        // primary variant image src (base64 or URL), shortcut set by backend
  variantImages?: Array<{ id: number; src: string; imagePath: string; isPrimary: boolean; displayOrder: number; }>; // all variant images
  variantDescription?: string;  // variant-specific short description
  
  // Legacy field for backward compatibility (maps to unitId)
  unitValueId?: number;
  
  // Backend relation (may be present in API response)
  unitValue?: {
    id: number;
    name: string;
    symbol?: string;
  };
  
  // Helper: Check if variant is available for purchase
  get isAvailable(): boolean {
    return (this.isActive !== false) && (this.stock > 0);
  }
  
  // Helper: Get effective min order quantity
  get effectiveMinOrderQuantity(): number {
    return this.minOrderQuantity ?? 1;
  }
  
  // Helper: Get effective max order quantity (respects stock)
  get effectiveMaxOrderQuantity(): number {
    const max = this.maxOrderQuantity ?? Infinity;
    return Math.min(max, this.stock);
  }
  
  // Helper: Validate order quantity
  isValidQuantity(qty: number): boolean {
    return qty >= this.effectiveMinOrderQuantity && qty <= this.effectiveMaxOrderQuantity;
  }
}