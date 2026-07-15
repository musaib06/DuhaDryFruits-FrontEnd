import { FormGroup } from '@angular/forms';
import { BaseViewModel } from '../../internal/base.viewmodel';
import { VideoSM } from '../../service-models/app/v1/website-resource/video-s-m';



export class VideoViewModel extends BaseViewModel {
  VideoFormData: VideoSM = new VideoSM();
  VideoForm!: FormGroup;
  VideoId: number = 0;
  VideoSMList :VideoSM [] = [];
  showAddModal = false;
  showEditModal = false;
  fileName: string = '';
  updateMode: boolean = false;
    filteredVideos: VideoSM[] = [];
    searchTerm = '';
    sortField = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';
}