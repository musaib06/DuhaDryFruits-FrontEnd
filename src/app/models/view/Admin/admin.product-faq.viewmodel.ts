import { ProductFaqSM } from '../../service-models/app/v1/product-faq-s-m';

export class AdminProductFaqFormData {
  id: number = 0;
  question: string = '';
  answer: string = '';
  displayOrder: number = 0;
  isActive: boolean = true;
}

export class AdminProductFaqViewModel {
  faqs: ProductFaqSM[] = [];
  faqFormData: AdminProductFaqFormData = new AdminProductFaqFormData();
  isEditing: boolean = false;
  isFormVisible: boolean = false;
  FormSubmitted: boolean = false;
}
