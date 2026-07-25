import { PaginationViewModel } from '../../internal/pagination.viewmodel';
import { BulkCartCustomItem, BulkCartItem } from '../../service-models/app/v1/bulk-order-s-m';
import { ProductSM } from '../../service-models/app/v1/product-s-m';

export class BulkOrdersViewModel {
  pagination: PaginationViewModel = { PageNo: 1, PageSize: 12, totalCount: 0, totalPages: [] };
  products: ProductSM[] = [];
  searchTerm = '';
  selectedCategoryId: number | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy = 'name_asc';
  isLoadingProducts = false;

  companyInfo = {
    companyName: '',
    gstNumber: '',
    businessType: '',
    contactPerson: '',
    phone: '',
    email: '',
    shippingAddress: '',
    billingAddress: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
  };

  customerNotes = '';
  sameAsBilling = true;
  currentStep: 'products' | 'cart' | 'company' | 'review' = 'products';
  showCartPanel = false;
  showCustomForm = false;

  customProduct: BulkCartCustomItem = {
    productName: '',
    description: '',
    requiredQuantity: 1,
    packaging: '',
    expectedBudget: undefined,
    expectedDeliveryDate: '',
    additionalNotes: '',
  };

  cartItems: BulkCartItem[] = [];
  customItems: BulkCartCustomItem[] = [];
  attachmentFiles: File[] = [];
  isSubmitting = false;
  submittedOrderNumber = '';
}
