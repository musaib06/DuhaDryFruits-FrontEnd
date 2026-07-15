import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { BaseComponent } from '../../../../../../base.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from '../../../../../../services/product.service';
import { ProductClient } from '../../../../../../clients/product.client';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../../../services/category.service';
import { AdminCategoriesViewModel } from '../../../../../../models/view/Admin/admin.categories.viewmodel';
import { CategorySM } from '../../../../../../models/service-models/app/v1/categories-s-m';
import { ProductSM } from '../../../../../../models/service-models/app/v1/product-s-m';
import { AdminProductsViewModel } from '../../../../../../models/view/Admin/admin-product.viewmodel';
import { UnitsService } from '../../../../../../services/unit.service';
import { UnitsViewModel } from '../../../../../../models/view/end-user/product/units.viewmodel';
import { AdminUnitsViewModel } from '../../../../../../models/view/Admin/admin.units.viewmodel';
import { ProductVariantSM } from '../../../../../../models/service-models/app/v1/variants-s-m';
import { QuillEditorComponent } from 'ngx-quill';
import {
  acceptedImageFileMessage,
  acceptedImageFormatsLabel,
  canPreviewImageFileInBrowser,
  isAcceptedImageFile,
  isHeicOrHeifFile,
  isImageFileTooLarge,
  maxImageUploadSizeLabel,
} from '../../../../../../utils/image-file.util';
import { productShareImageUrl, resolveImageUrl } from '../../../../../../utils/image-url.util';
import { blobToImageFile, revokeBlobUrl } from '../../../../../../utils/image-upload.util';
import { ProductUtils } from '../../../../../../utils/product.utils';

@Component({
  selector: 'app-admin-product-form',
  imports: [CommonModule, FormsModule, QuillEditorComponent],
  templateUrl: './admin-product-form.html',
  styleUrl: './admin-product-form.scss'
})
export class AdminProductForm extends BaseComponent<AdminProductsViewModel> implements OnInit {
  @Input() product: ProductSM | null = null;

  isSubmitting = false;
  selectedFiles: File[] = [];
  variantImageFiles: Map<number, File> = new Map();
  private filePreviewUrls = new Map<File, string>();
  existingImages: Array<{id?: number, src: string, imagePath?: string}> = []; // Store existing images with their paths
  imagesToDelete: number[] = []; // Track image IDs to delete
  primaryImageIndex: number = 0; // Index of the primary (first) image
  protected _logHandler: any;

  /** Quill editor modules configuration for rich description */
  quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }], // Heading levels
      ['bold', 'italic', 'underline', 'strike'], // Text formatting
      [{ list: 'ordered' }, { list: 'bullet' }], // Lists
      [{ indent: '-1' }, { indent: '+1' }], // Indentation
      [{ align: [] }], // Text alignment
      ['link'], // Links
      ['blockquote', 'code-block'], // Blocks
      [{ color: [] }, { background: [] }], // Colors
      ['clean'] // Remove formatting
    ]
  };

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private productService: ProductService,
    private productClient: ProductClient,
    private categoryService: CategoryService,
    private unitService: UnitsService,   
    public activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = new AdminProductsViewModel();
  }

  private parsePackSize(raw: unknown): number | null {
    if (raw === undefined || raw === null || raw === '') return null;
    const w = Number(raw);
    return Number.isFinite(w) && w > 0 ? w : null;
  }

  /** Pack size value stored in variant.weight — shown with selected unit symbol on storefront. */
  private variantWeightForSave(v: any): number | null {
    return this.parsePackSize(v?.weight);
  }

  /** Live preview for admin: "{pack size} {unit symbol}". */
  formatPackSizePreview(v: any): string {
    const unitMeta = this.viewModel.Units?.find((u) => u.id === (v?.unitValueId || v?.unitId));
    return ProductUtils.getDisplayUnit({
      weight: v?.weight,
      quantity: v?.quantity,
      unitSymbol: unitMeta?.symbol || v?.unitSymbol,
      unitName: unitMeta?.name || v?.unitName,
    }) || '—';
  }

  async ngOnInit() {
    try {
      this._commonService.presentLoading();
      // Initialize variants array if not present
      if (!this.viewModel.productFormData.variants) {
        this.viewModel.productFormData.variants = [];
      }

      // Load dropdown data without nesting loader calls.
      await this.loadCategories(false);
      await this.loadUnits(false);

      if (!this.product) {
        // New product - initialize defaults
        this.viewModel.productFormData.currency = 'INR';
        this.viewModel.productFormData.isActive = true;
        this.viewModel.productFormData.isBestSelling = false;
        this.viewModel.productFormData.itemId = ''; // Will be auto-generated
        this.addVariant(); // Add first variant
      } else {
        await this.getProductById(this.product.id, false);
      }
    } finally {
      this._commonService.dismissLoader();
      this.cdr.detectChanges();
    }
  }

async loadUnits(showLoader: boolean = true) {
    try {
      if (showLoader) this._commonService.presentLoading();
      const unitVm = new AdminUnitsViewModel();
      unitVm.pagination.PageNo = 1;
      unitVm.pagination.PageSize = 50; // fetch all (practical)
      const resp = await this.unitService.getAllPaginatedUnits(unitVm);
      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        this.viewModel.Units = resp.successData || [];
      }
      this.cdr.detectChanges();
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load .',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      if (showLoader) this._commonService.dismissLoader();
    }
  }

  /**
   * Auto-generate ItemId from product name
   * Format: Uppercase, remove spaces, special chars -> BASMATIRICE
   */
  generateItemId(): void {
    if (!this.viewModel.productFormData.name) {
      this.viewModel.productFormData.itemId = '';
      return;
    }
    
    // Convert to uppercase, remove spaces and special characters
    let itemId = this.viewModel.productFormData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Remove all non-alphanumeric
      .substring(0, 20); // Limit to 20 chars
    
    this.viewModel.productFormData.itemId = itemId;
    
    // Regenerate SKUs for all variants
    if (this.viewModel.productFormData.variants) {
      this.viewModel.productFormData.variants.forEach(v => this.generateSku(v));
    }
  }

  /**
   * Generate SKU for a variant
   * Format: ITEMID-<QTY><UNIT> (e.g., BASMATIRICE-1KG)
   * @param variant - The variant to generate SKU for
   * @param showToast - Whether to show toast notification (default: false for auto-generation)
   */
  generateSku(variant: ProductVariantSM, showToast: boolean = false): void {
    const product = this.viewModel.productFormData;
    
    // Ensure itemId is set
    if (!product.itemId || product.itemId.trim() === '') {
      if (product.name) {
        this.generateItemId();
      } else {
        variant.sku = '';
        if (showToast) {
          this._commonService.ShowToastAtTopEnd('Please enter product name first to generate SKU.', 'warning');
        }
        this.cdr.detectChanges(); // Trigger change detection
        return;
      }
    }
    
    const unit = this.viewModel.Units.find(u => u.id === variant.unitValueId);

    // Validate all required fields for SKU generation
    if (!product.itemId || product.itemId.trim() === '') {
      variant.sku = '';
      if (showToast) {
        this._commonService.ShowToastAtTopEnd('Item ID is missing. Please enter product name.', 'warning');
      }
      this.cdr.detectChanges();
      return;
    }
    
    if (!unit) {
      variant.sku = '';
      if (showToast) {
        this._commonService.ShowToastAtTopEnd('Please select a unit to generate SKU.', 'warning');
      }
      this.cdr.detectChanges();
      return;
    }
    
    if (!variant.quantity || Number(variant.quantity) <= 0) {
      variant.sku = '';
      if (showToast) {
        this._commonService.ShowToastAtTopEnd('Please enter a valid quantity (greater than 0) to generate SKU.', 'warning');
      }
      this.cdr.detectChanges();
      return;
    }

    // Format base SKU: ITEMID-<QTY><UNIT> (e.g., BASMATIRICE-1KG)
    // Use numeric quantity so "1.000" (string) does not become "1000" when stripping the dot.
    const qtyNum = Number(variant.quantity);
    let qty: string;
    if (Number.isInteger(qtyNum)) {
      qty = String(Math.trunc(qtyNum));
    } else {
      let qtyStr = qtyNum.toString();
      if (qtyStr.includes('.')) {
        qtyStr = qtyStr.replace('.', '');
      }
      qty = qtyStr;
    }
    const unitSymbol = (unit.symbol || unit.name || '').toUpperCase().replace(/\s+/g, '');
    const baseSku = `${product.itemId}-${qty}${unitSymbol}`;

    // Ensure SKU is unique at least within this product's variants.
    // If another variant already has the same base SKU, append a numeric suffix: -2, -3, ...
    const siblings = this.viewModel.productFormData.variants || [];
    const existingForBase = siblings
      .filter(v => v !== variant && typeof v.sku === 'string' && v.sku.toUpperCase().startsWith(baseSku.toUpperCase()))
      .map(v => v.sku || '');

    if (existingForBase.length === 0) {
      variant.sku = baseSku;
    } else {
      // Extract existing numeric suffixes for this baseSKU (e.g., ITEM-1KG-2 -> 2)
      let maxSuffix = 1;
      existingForBase.forEach(sku => {
        const parts = sku.toUpperCase().split('-');
        const lastPart = parts[parts.length - 1];
        const asNumber = Number(lastPart);
        if (!Number.isNaN(asNumber) && asNumber > maxSuffix) {
          maxSuffix = asNumber;
        }
      });
      const nextSuffix = maxSuffix + 1;
      variant.sku = `${baseSku}-${nextSuffix}`;
    }
    
    // Show success message only if manually triggered
    if (showToast) {
      this._commonService.ShowToastAtTopEnd(`SKU generated: ${variant.sku}`, 'success');
    }
    
    // Trigger change detection to update UI
    this.cdr.detectChanges();
  }

  /**
   * Manually regenerate SKU for a variant (called from button click)
   */
  regenerateSku(variant: ProductVariantSM): void {
    this.generateSku(variant, true);
  }

  /**
   * Called when unit dropdown changes
   */
  onUnitChange(variant: ProductVariantSM): void {
    this.generateSku(variant);
    this.cdr.detectChanges();
  }

  /**
   * Called when quantity input changes
   */
  onQuantityChange(variant: ProductVariantSM): void {
    this.generateSku(variant);
    this.cdr.detectChanges();
  }

  /** Bind pack size numeric value (any unit — combined with selected unit symbol on storefront). */
  onWeightChange(variant: ProductVariantSM, value: string | number): void {
    const parsed = this.parsePackSize(value);
    (variant as any).weight = parsed !== null ? parsed : null;
    this.cdr.detectChanges();
  }

  /**
   * Get missing fields for a variant (helper for error messages)
   */
  private getMissingFieldsForVariant(v: any): string {
    const missingFields = [];
    if (!this.viewModel.productFormData.itemId) missingFields.push('Item ID');
    if (!v.unitValueId) missingFields.push('Unit');
    if (!v.quantity || v.quantity <= 0) missingFields.push('Quantity');
    if (!v.price || v.price <= 0) missingFields.push('Price');
    if (v.stock === undefined || v.stock < 0) missingFields.push('Stock');
    return missingFields.length > 0 ? missingFields.join(', ') : 'Unknown fields';
  }

  /**
   * Check if form can be submitted (simpler check for button enablement)
   * This is more lenient than isFormValid - only checks essential fields
   */
  canSubmitForm(): boolean {
    try {
      // Basic checks
      if (!this.viewModel.productFormData.name?.trim()) {
        console.log('❌ Validation failed: Product name is missing');
        return false;
      }
      
      // Check category - must be a valid number, not undefined or null
      const categoryId = this.viewModel.productFormData.categoryId;
      if (!categoryId || categoryId === undefined || categoryId === null || categoryId === 0) {
        console.log('❌ Validation failed: Category is not selected. Current value:', categoryId);
        return false;
      }
      
      if (!this.viewModel.productFormData.variants?.length) {
        console.log('❌ Validation failed: No variants');
        return false;
      }

      // Ensure ItemId exists (generate if needed)
      if (!this.viewModel.productFormData.itemId?.trim()) {
        if (this.viewModel.productFormData.name) {
          this.generateItemId();
        } else {
          console.log('❌ Validation failed: ItemId is missing and cannot be generated');
          return false;
        }
      }

      // Check each variant has minimum required fields
      for (let i = 0; i < this.viewModel.productFormData.variants.length; i++) {
        const v = this.viewModel.productFormData.variants[i];
        
        if (!v.unitValueId) {
          console.log(`❌ Validation failed: Variant #${i + 1} - Unit is missing`);
          return false;
        }
        
        // Convert to numbers for comparison (inputs may return strings)
        const quantity = Number(v.quantity);
        const price = Number(v.price);
        const packSize = Number(v.weight);
        
        if (isNaN(quantity) || quantity <= 0) {
          console.log(`❌ Validation failed: Variant #${i + 1} - Invalid quantity:`, v.quantity);
          return false;
        }

        if (isNaN(packSize) || packSize <= 0) {
          console.log(`❌ Validation failed: Variant #${i + 1} - Invalid pack size:`, v.weight);
          return false;
        }
        
        if (isNaN(price) || price <= 0) {
          console.log(`❌ Validation failed: Variant #${i + 1} - Invalid price:`, v.price);
          return false;
        }
        
        // Stock defaults to 0 if not set
        if (v.stock === undefined || v.stock === null) {
          v.stock = 0;
        }
        
        // Try to generate SKU if missing (but don't fail if it can't be generated yet)
        if ((!v.sku || v.sku.trim() === '') && 
            this.viewModel.productFormData.itemId && 
            v.unitValueId && 
            quantity > 0) {
          this.generateSku(v);
        }
      }

      // Check images - must have at least one (either existing or newly selected)
      if (!this.hasImages()) {
        console.log('❌ Validation failed: No images selected');
        console.log('  - Existing images:', this.existingImages.length);
        console.log('  - Selected files:', this.selectedFiles.length);
        console.log('  - Images to delete:', this.imagesToDelete.length);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in canSubmitForm:', error);
      return false;
    }
  }

  /**
   * Get validation message for tooltip
   */
  getValidationMessage(): string {
    if (!this.viewModel.productFormData.name?.trim()) return 'Please enter product name';
    if (!this.viewModel.productFormData.categoryId) return 'Please select a category';
    if (!this.viewModel.productFormData.variants?.length) return 'Please add at least one variant';
    
    for (let i = 0; i < this.viewModel.productFormData.variants.length; i++) {
      const v = this.viewModel.productFormData.variants[i];
      if (!v.unitValueId) return `Variant #${i + 1}: Please select a unit`;
      
      const quantity = Number(v.quantity);
      const price = Number(v.price);
      
      if (isNaN(quantity) || quantity <= 0) return `Variant #${i + 1}: Please enter quantity > 0`;
      const packSize = Number(v.weight);
      if (isNaN(packSize) || packSize <= 0) return `Variant #${i + 1}: Please enter pack size > 0`;
      if (isNaN(price) || price <= 0) return `Variant #${i + 1}: Please enter price > 0`;
    }
    
    return 'Please fill all required fields';
  }
isVariantInvalid(v: any): boolean {
  // Required fields validation with proper number conversion
  if (!v.unitValueId) return true;
  
  const quantity = Number(v.quantity);
  const price = Number(v.price);
  const packSize = Number(v.weight);
  const stock = v.stock !== undefined && v.stock !== null ? Number(v.stock) : 0;
  
  if (isNaN(quantity) || quantity <= 0) return true;
  if (isNaN(packSize) || packSize <= 0) return true;
  if (isNaN(price) || price <= 0) return true;
  if (isNaN(stock) || stock < 0) return true;
  
  // SKU validation - only required for submission, not for UI validation
  // if (!v.sku || v.sku.trim() === '') return true;
  
  // Compare price validation
  if (v.comparePrice) {
    const comparePrice = Number(v.comparePrice);
    if (!isNaN(comparePrice) && comparePrice <= price) return true;
  }
  
  return false;
}

/**
 * Check if form is valid (including custom validations)
 * This is called by the template to enable/disable the submit button
 * Note: This is a "soft" validation - strict validation happens in onSubmit()
 * We check if required fields are filled, not if SKU exists (it will be generated)
 */
isFormValid(): boolean {
  try {
    // Check basic form validity
    if (!this.viewModel.productFormData.name || this.viewModel.productFormData.name.trim() === '') {
      return false;
    }

    if (!this.viewModel.productFormData.categoryId) {
      return false;
    }

    // Check variants exist
    if (!this.viewModel.productFormData.variants || this.viewModel.productFormData.variants.length === 0) {
      return false;
    }

    // Generate ItemId if missing (needed for SKU generation)
    if (!this.viewModel.productFormData.itemId || this.viewModel.productFormData.itemId.trim() === '') {
      if (this.viewModel.productFormData.name) {
        this.generateItemId();
      } else {
        return false;
      }
    }

    // Ensure stock is set for all variants (default to 0)
    this.viewModel.productFormData.variants.forEach(v => {
      if (v.stock === undefined || v.stock === null) {
        v.stock = 0;
      }
    });

    // Try to generate SKU for all variants (if not already generated and required fields are present)
    this.viewModel.productFormData.variants.forEach(v => {
      // Only generate if SKU is missing and all required fields are present
      if ((!v.sku || v.sku.trim() === '') && 
          this.viewModel.productFormData.itemId && 
          v.unitValueId && 
          v.quantity && v.quantity > 0) {
        this.generateSku(v);
      }
    });

    // Check if all variants have basic required fields filled
    // We don't require SKU to exist here - it will be generated in onSubmit if needed
    for (const v of this.viewModel.productFormData.variants) {
      // Check required fields with proper number conversion
      if (!v.unitValueId) {
        return false;
      }
      
      const quantity = Number(v.quantity);
      const price = Number(v.price);
      const stock = v.stock !== undefined && v.stock !== null ? Number(v.stock) : 0;
      
      if (isNaN(quantity) || quantity <= 0) {
        return false;
      }
      if (isNaN(price) || price <= 0) {
        return false;
      }
      if (isNaN(stock) || stock < 0) {
        return false;
      }
      
      // For SKU: Check if it CAN be generated (all required fields present)
      // We don't require SKU to exist yet - it will be auto-generated in onSubmit
      // Just verify we have everything needed: itemId, unitValueId, quantity
      if (!this.viewModel.productFormData.itemId || !v.unitValueId || isNaN(quantity) || quantity <= 0) {
        return false;
      }
      
      // Compare price validation (if provided, must be > price)
      if (v.comparePrice) {
        const comparePrice = Number(v.comparePrice);
        if (!isNaN(comparePrice) && comparePrice > 0 && comparePrice <= price) {
          return false;
        }
      }
    }

    // Images check - allow button to be enabled even if images not selected yet
    // Strict validation will happen in onSubmit()
    
    return true;
  } catch (error) {
    console.error('Error in isFormValid:', error);
    return false;
  }
}
  async loadCategories(showLoader: boolean = true) {
    try {
      if (showLoader) this._commonService.presentLoading();
      const catVm = new AdminCategoriesViewModel();
      catVm.pagination.PageNo = 1;
      catVm.pagination.PageSize = 50; // fetch all (practical)
      const resp = await this.categoryService.getAllCategories(catVm);
      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        this.viewModel.categories = [...(resp.successData || [])].sort((a: any, b: any) => {
          const aSeq = Number(a?.sequence ?? 0);
          const bSeq = Number(b?.sequence ?? 0);
          if (aSeq !== bSeq) return aSeq - bSeq;
          return String(a?.name || '').localeCompare(String(b?.name || ''));
        });
      }
      this.cdr.detectChanges();
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load categories.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      if (showLoader) this._commonService.dismissLoader();
    }
  }

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files;
    if (!files || files.length === 0) return;

    const incomingFiles = this.filterAcceptedImageFiles(Array.from(files) as File[], input);
    const existingFiles = this.selectedFiles || [];
    const dedupedFiles = incomingFiles.filter(file =>
      !existingFiles.some(existing =>
        existing.name === file.name && existing.size === file.size && existing.type === file.type
      )
    );
    if (dedupedFiles.length === 0) return;

    this._commonService.presentLoading();
    try {
      const prepared: File[] = [];
      for (const file of dedupedFiles) {
        const ready = await this.prepareFileForUpload(file);
        if (!this.filePreviewUrls.has(ready)) {
          this.filePreviewUrls.set(ready, URL.createObjectURL(ready));
        }
        prepared.push(ready);
      }
      this.selectedFiles = [...existingFiles, ...prepared];
    } catch (error: any) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Image error',
        text: error?.message || 'Could not process one or more images.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
      this.cdr.detectChanges();
    }
  }

  /** HEIC and unknown types are converted on the server so preview + upload always work. */
  private async prepareFileForUpload(file: File): Promise<File> {
    const needsServerPrep =
      isHeicOrHeifFile(file) ||
      !canPreviewImageFileInBrowser(file) ||
      !file.type ||
      file.type === 'application/octet-stream';

    if (!needsServerPrep) {
      return file;
    }

    const formData = new FormData();
    formData.append('image', file, file.name);
    const blob = await this.productService.prepareProductImage(formData);
    return blobToImageFile(blob, file.name);
  }

  private filterAcceptedImageFiles(files: File[], input?: HTMLInputElement | null): File[] {
    const accepted: File[] = [];
    for (const file of files) {
      if (isImageFileTooLarge(file)) {
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: `Image size should be less than ${this.maxImageSizeLabel}`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        continue;
      }
      if (!isAcceptedImageFile(file)) {
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: acceptedImageFileMessage(),
          icon: 'error',
          confirmButtonText: 'OK'
        });
        continue;
      }
      accepted.push(file);
    }
    if (input) {
      input.value = '';
    }
    return accepted;
  }

  readonly supportedImageFormats = acceptedImageFormatsLabel();
  readonly maxImageSizeLabel = maxImageUploadSizeLabel();

  /** Browsers cannot preview HEIC — show placeholder in template instead. */
  isHeicPreview(file: File): boolean {
    return isHeicOrHeifFile(file);
  }

  canPreviewSelectedFile(file: File): boolean {
    return canPreviewImageFileInBrowser(file);
  }

  isVariantHeicPreview(variantIndex: number): boolean {
    const file = this.variantImageFiles.get(variantIndex);
    return file ? isHeicOrHeifFile(file) : false;
  }

  getFilePreview(file: File): string {
    if (!this.filePreviewUrls.has(file)) {
      this.filePreviewUrls.set(file, URL.createObjectURL(file));
    }
    return this.filePreviewUrls.get(file)!;
  }

  getExistingImageSrc(img: { id?: number; src?: string; imagePath?: string }): string {
    const raw = img.src || img.imagePath || '';
    const productId = this.viewModel.productFormData?.id;
    const fallback =
      productId && img.id
        ? productShareImageUrl(productId, { imageId: img.id })
        : productId
          ? productShareImageUrl(productId)
          : 'assets/logo.png';
    return resolveImageUrl(raw, fallback);
  }

  onExistingImageError(event: Event, img: { id?: number }): void {
    const productId = this.viewModel.productFormData?.id;
    if (productId && img?.id) {
      this._commonService.onProductImageError(event, productId, 'assets/logo.png', img.id);
    } else {
      this._commonService.onImageError(event);
    }
  }

  hasImages(): boolean {
    // used for validation: either existing images present (after filtering deleted ones) or user selected new files (create needs images)
    const remainingExisting = this.existingImages.filter(img => !this.imagesToDelete.includes(img.id || 0)).length;
    return this.selectedFiles.length > 0 || remainingExisting > 0;
  }

  /**
   * Remove image from preview (for existing images)
   */
  removeExistingImage(index: number): void {
    const image = this.existingImages[index];
    if (image) {
      // Only track deletion if image has a valid ID (from database)
      if (image.id && image.id > 0) {
        this.imagesToDelete.push(image.id);
      }
      this.existingImages.splice(index, 1);
      // Also remove from viewModel.productFormData.images if it exists
      if (this.viewModel.productFormData.images) {
        this.viewModel.productFormData.images = this.viewModel.productFormData.images.filter((_, i) => i !== index);
      }
      this.cdr.detectChanges();
    }
  }

  /**
   * Remove newly selected file
   */
  removeSelectedFile(index: number): void {
    const removed = this.selectedFiles[index];
    if (removed) {
      revokeBlobUrl(this.filePreviewUrls.get(removed));
      this.filePreviewUrls.delete(removed);
    }
    this.selectedFiles.splice(index, 1);
    this.cdr.detectChanges();
  }

  async onSubmit(form: any): Promise<void> {
    this.viewModel.FormSubmitted = true;
    
    // Custom validation instead of relying on form.invalid (which may fail with dynamic fields)
    // Check basic required fields manually
    if (!this.viewModel.productFormData.name || this.viewModel.productFormData.name.trim() === '') {
      this._commonService.ShowToastAtTopEnd('Please enter product name.', 'error');
      return;
    }
    
    if (!this.viewModel.productFormData.categoryId) {
      this._commonService.ShowToastAtTopEnd('Please select a category.', 'error');
      return;
    }

    // Validate variants exist
    if (!this.viewModel.productFormData.variants || this.viewModel.productFormData.variants.length === 0) {
      this._commonService.showSweetAlertToast({
        title: 'Validation Error',
        text: 'At least one product variant is required.',
        icon: 'warning'
      });
      return;
    }

    // CRITICAL: Generate ItemId first if missing
    if (!this.viewModel.productFormData.itemId || this.viewModel.productFormData.itemId.trim() === '') {
      if (this.viewModel.productFormData.name) {
        this.generateItemId();
      } else {
        this._commonService.showSweetAlertToast({
          title: 'Validation Error',
          text: 'Product name is required to generate Item ID and SKU.',
          icon: 'warning'
        });
        return;
      }
    }

    // STEP 2: Ensure stock is set (default to 0 if undefined) BEFORE SKU generation
    this.viewModel.productFormData.variants.forEach(v => {
      if (v.stock === undefined || v.stock === null) {
        v.stock = 0;
      }
    });

    // STEP 3: CRITICAL - Generate SKU for all variants BEFORE validation
    // This ensures SKU is always present even if user didn't change unit/quantity
    let skuGenerationFailed = false;
    let failedVariantIndex = -1;
    
    for (let index = 0; index < this.viewModel.productFormData.variants.length; index++) {
      const v = this.viewModel.productFormData.variants[index];
      
      // Generate SKU for this variant
      this.generateSku(v);
      
      // Check if SKU generation failed
      if (!v.sku || v.sku.trim() === '') {
        skuGenerationFailed = true;
        failedVariantIndex = index;
        
        // Try to identify what's missing
        let missingFields = [];
        if (!this.viewModel.productFormData.itemId) missingFields.push('Item ID');
        if (!v.unitValueId) missingFields.push('Unit');
        if (!v.quantity || v.quantity <= 0) missingFields.push('Quantity');
        
        break; // Exit loop on first failure
      }
    }

    if (skuGenerationFailed) {
      this._commonService.showSweetAlertToast({
        title: 'Validation Error',
        text: `Variant #${failedVariantIndex + 1}: SKU could not be generated. Missing: ${this.getMissingFieldsForVariant(this.viewModel.productFormData.variants[failedVariantIndex])}. Please fill all required fields.`,
        icon: 'warning'
      });
      return;
    }

    // Now validate variants after SKU generation
    const invalidVariant = this.viewModel.productFormData.variants.some(v => this.isVariantInvalid(v));
    if (invalidVariant) {
      // Find which variant is invalid and why
      const invalidVariants = this.viewModel.productFormData.variants
        .map((v, i) => ({ variant: v, index: i }))
        .filter(({ variant }) => this.isVariantInvalid(variant));
      
      const errorMessages = invalidVariants.map(({ variant, index }) => {
        const issues = [];
        if (!variant.unitValueId) issues.push('Unit');
        if (!variant.quantity || variant.quantity <= 0) issues.push('Quantity');
        if (!variant.price || variant.price <= 0) issues.push('Price');
        if (!variant.sku || variant.sku.trim() === '') issues.push('SKU');
        if (variant.stock === undefined || variant.stock < 0) issues.push('Stock');
        return `Variant #${index + 1}: ${issues.join(', ')}`;
      });
      
      this._commonService.showSweetAlertToast({
        title: 'Validation Error',
        text: `Please fix variant fields:\n${errorMessages.join('\n')}`,
        icon: 'warning'
      });
      return;
    }

    // Ensure at least one default variant
    const hasDefault = this.viewModel.productFormData.variants.some(v => v.isDefaultVariant);
    if (!hasDefault) {
      // Set first variant as default
      this.viewModel.productFormData.variants[0].isDefaultVariant = true;
    }

    if (!this.hasImages()) {
      this._commonService.ShowToastAtTopEnd('Please select at least one product image.', 'error');
      return;
    }

    this.isSubmitting = true;
    try {
      if (this.product && this.product.id) {
        await this.updateProduct();
      } else {
        await this.addProduct();
      }
    } finally {
      this.isSubmitting = false;
    }
  }
addVariant() {
  // Ensure variants array exists
  if (!this.viewModel.productFormData.variants) {
    this.viewModel.productFormData.variants = [];
  }
  
  // Create a new variant with default values
  const newVariant: ProductVariantSM = {
    id: 0, // New variant, will be assigned by backend
    productId: this.viewModel.productFormData.id || 0,
    unitValueId: undefined, // Will be selected from dropdown
    quantity: 1,
    weight: null as any,
    price: 0,
    comparePrice: undefined,
    sku: '',
    barcode: undefined,
    stock: 0,
    isDefaultVariant: this.viewModel.productFormData.variants.length === 0, // First variant is default
    isActive: true,
    variantImage: undefined, // Variant-specific image
    variantDescription: '', // Variant-specific description
  } as ProductVariantSM;
  
  this.viewModel.productFormData.variants.push(newVariant);
}

removeVariant(index: number) {
  this.viewModel.productFormData.variants.splice(index, 1);
}

setDefaultVariant(index: number) {
  this.viewModel.productFormData.variants.forEach((v, i) => {
    v.isDefaultVariant = i === index;
  });
}

// Variant-specific image handling
async onVariantImageChange(event: any, variantIndex: number) {
  const file = event.target.files[0];
  if (!file) return;

  const accepted = this.filterAcceptedImageFiles([file], event.target);
  if (accepted.length === 0) return;

  this._commonService.presentLoading();
  try {
    const selected = await this.prepareFileForUpload(accepted[0]);
    const variant = this.viewModel.productFormData.variants[variantIndex];
    revokeBlobUrl(variant.variantImage);
    this.variantImageFiles.set(variantIndex, selected);
    variant.variantImage = URL.createObjectURL(selected);
    this.cdr.detectChanges();
  } catch (error: any) {
    this._commonService.showSweetAlertToast({
      title: 'Image error',
      text: error?.message || 'Could not process variant image.',
      icon: 'error',
      confirmButtonText: 'OK',
    });
  } finally {
    this._commonService.dismissLoader();
  }
}

removeVariantImage(variantIndex: number) {
  const variant = this.viewModel.productFormData.variants[variantIndex];
  revokeBlobUrl(variant.variantImage);
  this.variantImageFiles.delete(variantIndex);
  variant.variantImage = undefined;
  this.cdr.detectChanges();
}

  /**
   * Set an existing image as the primary (first) image
   */
  setPrimaryExistingImage(index: number): void {
    if (index === 0) return; // Already primary
    // Reorder existingImages array to put primary first
    const primaryImage = this.existingImages.splice(index, 1)[0];
    this.existingImages.unshift(primaryImage);
    this.cdr.detectChanges();
  }

  /**
   * Set a newly selected file as the primary (first) image
   */
  setPrimarySelectedFile(index: number): void {
    if (index === 0) return; // Already first
    // Reorder selectedFiles array to put primary first
    const primaryFile = this.selectedFiles.splice(index, 1)[0];
    this.selectedFiles.unshift(primaryFile);
    this.cdr.detectChanges();
  }

  /**
   * Convert base64 data URL to File object
   */
  private base64ToFile(base64Data: string, filename: string): File {
    // Extract mime type and base64 data
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // Expose Math to template if needed
  Math = Math;

  /**
   * Round number to 2 decimal places (for price)
   */
  roundToTwo(value: any): number {
    const num = Number(value);
    if (!num || isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
  }

  /**
   * Parse value as integer (for stock)
   */
  roundStock(value: any): number {
    const num = Number(value);
    if (!num || isNaN(num)) return 0;
    return Math.floor(num);
  }

  private async addProduct() {
    try {
      this._commonService.presentLoading();
      
      // Ensure ItemId is set (should be auto-generated, but double-check)
      if (!this.viewModel.productFormData.itemId || this.viewModel.productFormData.itemId.trim() === '') {
        this.generateItemId();
      }
      
      // Final SKU generation pass (ensure all SKUs are set)
      this.viewModel.productFormData.variants.forEach(v => {
        this.generateSku(v);
      });
      
      // Separate product images from variant images
      const productImageFiles: File[] = [];
      const variantImageFiles: Map<number, File> = new Map(); // variantIndex -> File
      
      // Process selected files - separate product images from variant images
      // Files with fieldname starting with 'variantImage' are variant images
      // Note: selectedFiles currently contains all files, we need to track which is which
      // For now, we'll use the variantImage base64 data to create File objects
      
      // Prepare product data for backend (ensure variants have correct structure)
      const productData = {
        name: this.viewModel.productFormData.name,
        subtitle: this.viewModel.productFormData.subtitle || null,
        description: this.viewModel.productFormData.description || null,
        richDescription: this.viewModel.productFormData.richDescription || null,
        itemId: this.viewModel.productFormData.itemId,
        currency: this.viewModel.productFormData.currency || 'INR',
        isActive: this.viewModel.productFormData.isActive !== false,
        isBestSelling: this.viewModel.productFormData.isBestSelling || false,
        hsnCode: this.viewModel.productFormData.hsnCode || null,
        taxRate: this.viewModel.productFormData.taxRate || null,
        shippingCharge: this.viewModel.productFormData.shippingCharge ?? null,
        categoryId: this.viewModel.productFormData.categoryId,
        secondaryCategoryId: this.viewModel.productFormData.secondaryCategoryId || null,
        variants: this.viewModel.productFormData.variants.map((v, index) => {
          // Validate required fields before mapping
          if (!v.unitValueId || !v.quantity || !v.price || !v.sku) {
            console.error('Invalid variant:', v);
            throw new Error(`Variant is missing required fields: unitValueId=${v.unitValueId}, quantity=${v.quantity}, price=${v.price}, sku=${v.sku}`);
          }
          
          return {
            unitValueId: v.unitValueId, // Backend expects unitValueId
            quantity: Number(v.quantity),
            weight: this.variantWeightForSave(v),
            price: Number(v.price),
            comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
            sku: v.sku.trim(), // Ensure SKU is trimmed and present
            barcode: v.barcode ? v.barcode.trim() : null,
            stock: Number(v.stock || 0),
            isDefaultVariant: v.isDefaultVariant || false,
            isActive: v.isActive !== undefined ? v.isActive : true,
            variantDescription: v.variantDescription || null, // NEW: Variant-specific description
          };
        })
      };
      
      // Debug log to verify payload
      console.log('Product Data being sent:', JSON.stringify(productData, null, 2));
      
      const formData = new FormData();
      formData.append('reqData', JSON.stringify(productData));
      
      // Add product images (files that are not variant-specific)
      // For now, all selected files are treated as product images
      // Variant images need to be tracked separately in the UI
      for (const f of this.selectedFiles) {
        formData.append('images', f);
      }
      
      // Add variant images if they exist
      // Convert base64 variant images to files and add with specific fieldnames
      for (let i = 0; i < this.viewModel.productFormData.variants.length; i++) {
        const variantFile = this.variantImageFiles.get(i);
        if (variantFile) {
          formData.append(`variantImages_${i}`, variantFile, variantFile.name);
          console.log(`📎 Added variant image for variant ${i}`);
          continue;
        }
        const v = this.viewModel.productFormData.variants[i];
        if (v.variantImage && v.variantImage.startsWith('data:')) {
          const file = this.base64ToFile(v.variantImage, `variant-image-${i}.jpg`);
          formData.append(`variantImages_${i}`, file);
          console.log(`📎 Added variant image for variant ${i}`);
        }
      }

      const resp = await this.productService.addProduct(formData);
      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error'
        });
      } else {
        this._commonService.showSweetAlertToast({
          title: 'Success',
          text: 'Product added successfully.',
          icon: 'success'
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to add product.',
        icon: 'error'
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async updateProduct() {
    try {
      this._commonService.presentLoading();
      
      // Ensure ItemId is set
      if (!this.viewModel.productFormData.itemId || this.viewModel.productFormData.itemId.trim() === '') {
        this.generateItemId();
      }
      
      // Final SKU generation pass (ensure all SKUs are set)
      this.viewModel.productFormData.variants.forEach(v => {
        this.generateSku(v);
      });
      
      // Prepare product data for backend (ensure variants have correct structure)
      const productData: any = {
        name: this.viewModel.productFormData.name,
        subtitle: this.viewModel.productFormData.subtitle || null,
        description: this.viewModel.productFormData.description || null,
        richDescription: this.viewModel.productFormData.richDescription || null,
        itemId: this.viewModel.productFormData.itemId,
        currency: this.viewModel.productFormData.currency || 'INR',
        isActive: this.viewModel.productFormData.isActive !== false,
        isBestSelling: this.viewModel.productFormData.isBestSelling || false,
        hsnCode: this.viewModel.productFormData.hsnCode || null,
        taxRate: this.viewModel.productFormData.taxRate || null,
        shippingCharge: this.viewModel.productFormData.shippingCharge ?? null,
        categoryId: this.viewModel.productFormData.categoryId,
        secondaryCategoryId: this.viewModel.productFormData.secondaryCategoryId || null,
        variants: this.viewModel.productFormData.variants.map(v => {
          // For existing variants, validate required fields
          if (v.id) {
            // Existing variant - all fields should be present
            if (!v.unitValueId || !v.quantity || !v.price || !v.sku) {
              console.error('Invalid existing variant:', v);
              throw new Error(`Existing variant is missing required fields: unitValueId=${v.unitValueId}, quantity=${v.quantity}, price=${v.price}, sku=${v.sku}`);
            }
          } else {
            // New variant - validate all required fields
            if (!v.unitValueId || !v.quantity || !v.price || !v.sku) {
              console.error('Invalid new variant:', v);
              throw new Error(`New variant is missing required fields: unitValueId=${v.unitValueId}, quantity=${v.quantity}, price=${v.price}, sku=${v.sku}`);
            }
          }
          
          return {
            id: v.id && Number(v.id) > 0 ? Number(v.id) : undefined,
            unitValueId: Number(v.unitValueId),
            quantity: Number(v.quantity),
            weight: this.variantWeightForSave(v),
            price: Number(v.price),
            comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
            sku: v.sku.trim(), // Ensure SKU is trimmed and present
            barcode: v.barcode ? v.barcode.trim() : null,
            stock: Number(v.stock || 0),
            isDefaultVariant: v.isDefaultVariant || false,
            isActive: v.isActive !== undefined ? v.isActive : true,
            variantDescription: v.variantDescription || null, // NEW: Variant-specific description
          };
        }),
        imagesToDelete: this.imagesToDelete
      };
      
      // Debug log to verify payload
      console.log('Product Data being sent (update):', JSON.stringify(productData, null, 2));
      
      const formData = new FormData();
      
      formData.append('reqData', JSON.stringify(productData));
      // Add product images
      for (const f of this.selectedFiles) {
        formData.append('images', f);
      }
      
      // Add variant images if they exist
      for (let i = 0; i < this.viewModel.productFormData.variants.length; i++) {
        const variantFile = this.variantImageFiles.get(i);
        if (variantFile) {
          const v = this.viewModel.productFormData.variants[i];
          const fieldKey = v.id && v.id > 0 ? v.id : i;
          formData.append(`variantImages_${fieldKey}`, variantFile, variantFile.name);
          console.log(`📎 Added variant image for variant ${fieldKey} (update)`);
          continue;
        }
        const v = this.viewModel.productFormData.variants[i];
        if (v.variantImage && v.variantImage.startsWith('data:')) {
          const file = this.base64ToFile(v.variantImage, `variant-image-${i}.jpg`);
          const fieldKey = v.id && v.id > 0 ? v.id : i;
          formData.append(`variantImages_${fieldKey}`, file);
          console.log(`📎 Added variant image for variant ${fieldKey} (update)`);
        }
      }

      const resp = await this.productService.updateProduct(formData, this.viewModel.productFormData.id);
      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error'
        });
      } else {
        this._commonService.showSweetAlertToast({
          title: 'Success',
          text: 'Product updated successfully.',
          icon: 'success'
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to update product.',
        icon: 'error'
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async getProductById(id: number, showLoader: boolean = true) {
    try {
      if (showLoader) this._commonService.presentLoading();
      // Prefer admin endpoint (includes inactive/archived). Fall back to public API if admin fails (e.g. older server).
      let rawResp = await this.productClient.GetAdminProductById(id);
      if (rawResp.isError) {
        rawResp = await this.productClient.GetProductById(id);
      }
      if (rawResp.isError) {
        await this._logHandler.logObject(rawResp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: rawResp.errorData.displayMessage,
          icon: 'error'
        });
        return;
      }
      
      const rawProduct = rawResp.successData as any;
      this.viewModel.productFormData = rawProduct;
      if (this.viewModel.productFormData.isActive === undefined || this.viewModel.productFormData.isActive === null) {
        this.viewModel.productFormData.isActive = true;
      }

      // REFACTOR: Map variants to ensure unitValueId is set (from unitId or unitValue relation)
      if (this.viewModel.productFormData.variants && this.viewModel.productFormData.variants.length > 0) {
        this.viewModel.productFormData.variants = this.viewModel.productFormData.variants.map((v: any) => {
          // Ensure unitValueId is set and numeric (ng-select strict match)
          if (v.unitValueId != null) {
            v.unitValueId = Number(v.unitValueId);
          } else if (v.unitId != null) {
            v.unitValueId = Number(v.unitId);
          } else if (v.unitValue?.id != null) {
            v.unitValueId = Number(v.unitValue.id);
          }
          if (v.quantity != null && v.quantity !== '') {
            v.quantity = Number(v.quantity);
          }
          if (v.price != null && v.price !== '') {
            v.price = Number(v.price);
          }
          if (v.comparePrice != null && v.comparePrice !== '') {
            v.comparePrice = Number(v.comparePrice);
          }
          // Ensure stock is set
          if (v.stock === undefined || v.stock === null) {
            v.stock = 0;
          } else {
            v.stock = Number(v.stock);
          }
          // Ensure isActive is set (default to true if undefined)
          if (v.isActive === undefined || v.isActive === null) {
            v.isActive = true;
          }
          // Load variant image from backend response if available
          // variantImages array contains all variant images, use the first one (primary) as the main variant image
          if (v.variantImages && Array.isArray(v.variantImages) && v.variantImages.length > 0) {
            const primaryImage = v.variantImages.find((img: any) => img.isPrimary) || v.variantImages[0];
            v.variantImage = primaryImage.src || primaryImage.imagePath || primaryImage;
          } else if (v.variantImagePath) {
            // Fallback to variantImagePath if variantImages array not present
            v.variantImage = v.variantImagePath;
          }
          const parsedWeight = this.parsePackSize(v?.weight);
          v.weight = parsedWeight !== null ? parsedWeight : (null as any);
          return v;
        });
      }

      // Load existing product-level images only (variant images stay on variants).
      if (rawProduct.images && Array.isArray(rawProduct.images)) {
        const seen = new Set<string>();
        this.existingImages = rawProduct.images
          .filter((img: any) => !img?.variantId)
          .map((img: any) => {
            if (typeof img === 'string') {
              return {
                id: 0,
                src: resolveImageUrl(img, ''),
                imagePath: img,
              };
            }
            return {
              id: img.id || 0,
              src: resolveImageUrl(img.src || img.imageUrl || img.imagePath || '', ''),
              imagePath: img.imagePath || img.src || img,
            };
          })
          .filter((img: { imagePath?: string; src?: string }) => {
            const key = String(img.imagePath || img.src || '').trim().toLowerCase();
            if (!key || seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });
      } else {
        this.existingImages = [];
      }

      // Keep form images in display-ready format for fallback UI usage.
      if (this.viewModel.productFormData.images && Array.isArray(this.viewModel.productFormData.images)) {
        this.viewModel.productFormData.images = this.viewModel.productFormData.images
          .map((img: any) => (typeof img === 'string' ? img : img?.src))
          .filter(Boolean);
      }

      // Reset images-to-delete tracker on each fresh load.
      this.imagesToDelete = [];
      this.cdr.detectChanges();
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load product details.',
        icon: 'error'
      });
    } finally {
      if (showLoader) this._commonService.dismissLoader();
    }
  }
}
