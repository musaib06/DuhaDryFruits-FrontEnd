import { FormGroup } from '@angular/forms';
import { BaseViewModel } from '../../internal/base.viewmodel';
import { BannerSM } from '../../service-models/app/v1/website-resource/banner-s-m';

export class BannerViewModel extends BaseViewModel {
  bannerFormData: BannerSM = new BannerSM();
  bannerForm!: FormGroup;
  bannerId: number = 0;
  bannerSMList :BannerSM [] = [];
  showAddModal = false;
  showEditModal = false;
  fileName: string = '';
   updateMode: boolean = false;
    filteredBanners: BannerSM[] = [];
    searchTerm = '';
    sortField = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';
}
