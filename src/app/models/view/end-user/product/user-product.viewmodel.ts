import { BaseViewModel } from '../../../internal/base.viewmodel';
import { ProductSM } from '../../../service-models/app/v1/product-s-m';
import { ProductFaqSM } from '../../../service-models/app/v1/product-faq-s-m';
import { ReviewSM } from '../../../service-models/app/v1/review-s-m';

export class UserProductViewModel extends BaseViewModel {
  product = new ProductSM();
  /** Active FAQs for this product (sorted by display order). */
  faqs: ProductFaqSM[] = [];
  selectedImageIndex = 0;
  loading = false;
  qty = 1;
  maxQty = 1;
  errorMsg = '';
  /** Must default to [] — template reads `.length` as soon as `product.name` is set. */
  products: ProductSM[] = [];
  filteredProducts: ProductSM[] = [];
  categoryId!: number;
  reviewsSM: ReviewSM[] = [];
  cartItems: ProductSM[] = [];
  
  // UI toggles
  showReviews = false;
  showDescription = false;  // Description expanded by default
  showSpecs = false;       // Specifications collapsed by default
  showFullRichDesc = false;
  
  averageRating = 0;
  reviewFormData: ReviewSM = new ReviewSM();
}
