import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BaseComponent } from '../../../../../../../base.component';
import { LogHandlerService } from '../../../../../../../services/log-handler.service';
import { CommonService } from '../../../../../../../services/common.service';
import { PaginationComponent } from '../../../../../internal/pagination/pagination.component';
import { VideoSM } from '../../../../../../../models/service-models/app/v1/website-resource/video-s-m';
import { VideoViewModel } from '../../../../../../../models/view/website-resource/video.viewmodel';
import { AddEditVideo } from '../add-edit-video/add-edit-video';
import { VideoService } from '../../../../../../../services/video.service';



@Component({
  selector: 'app-video-list',
   imports: [CommonModule,FormsModule,PaginationComponent],
  templateUrl: './video-list.html',
  styleUrl: './video-list.scss'
})

export class VideoList extends BaseComponent<VideoViewModel> implements OnInit {
    protected _logHandler: LogHandlerService;
  constructor(commonService:CommonService,logHandler:LogHandlerService, private modalService: NgbModal,private videoService: VideoService) {
    super(commonService,logHandler);
    this._logHandler = logHandler;
    this.viewModel = new VideoViewModel();
  }
  // Video: Video[] = [];
  // filteredVideo: Video[] = [];

  ngOnInit(){
this.loadPageData()
  }

  // Additional methods for handling Video can be added here
   override async loadPageData(){
     try {
      this._commonService.presentLoading();
      let resp=await this.videoService.getAllPaginatedVideo(this.viewModel);
      if(resp.isError){
       await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
      else{
        this.viewModel.VideoSMList = resp.successData;
        console.log('Video loaded:', this.viewModel.VideoSMList);
          //     this.Video = data;
         this.viewModel.filteredVideos = [...resp.successData];
         this.sortData();
         this.TotalVideoCount();
      }

     } catch (error) {
      
        await this._logHandler.logObject(error);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Failed to load Video.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    
     finally{
      this._commonService.dismissLoader();
     }
  }

    /**this function is used to create an event for pagination */
  async loadPagedataWithPagination(pageNumber: number) {
    if (pageNumber && pageNumber > 0) {
      // this.viewModel.PageNo = pageNumber;
      this.viewModel.pagination.PageNo = pageNumber;
      await this.loadPageData();
    }
  }
 applyFilter(): void {
    if (!this.viewModel.searchTerm) {
      this.viewModel.filteredVideos = [...this.viewModel.VideoSMList];
    } else {
      const term = this.viewModel.searchTerm.toLowerCase();
      this.viewModel.filteredVideos  = this.viewModel.VideoSMList.filter(cat => 
        cat.title.toLowerCase().includes(term) || 
        (cat.youtubeUrl && cat.youtubeUrl.toLowerCase().includes(term))
      );
    }
    this.sortData();
  }

  sortData(field?: string): void {
    if (field) {
      if (this.viewModel.sortField === field) {
        this.viewModel.sortDirection = this.viewModel.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.viewModel.sortField = field;
        this.viewModel.sortDirection = 'asc';
      }
    }
    
    this.viewModel.filteredVideos.sort((a, b) => {
      let valueA = a[this.viewModel.sortField as keyof VideoSM];
      let valueB = b[this.viewModel.sortField as keyof VideoSM];
      
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      
      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return this.viewModel.sortDirection === 'asc' ? 1 : -1;
      if (valueB === undefined) return this.viewModel.sortDirection === 'asc' ? -1 : 1;
      if (valueA < valueB) return this.viewModel.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.viewModel.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(field: string): string {
    if (this.viewModel.sortField !== field) return 'bi-sort';
    return this.viewModel.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  async TotalVideoCount(){
    try {
      this._commonService.presentLoading();
      let resp = await this.videoService.getTotalVideoCount();
      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.pagination.totalCount = resp.successData.intResponse;
        console.log(this.viewModel.pagination.totalCount)
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load total Video count.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  
openFormModal(Video?: VideoSM): void {
    const modalRef = this.modalService.open(AddEditVideo, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.Video = Video || null;    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadPageData();
      }
    }).catch(() => {});
  }

confirmDelete(id: number): void {
    if (confirm('Are you sure you want to delete this Video?')) {
      this.videoService.deleteVideo(id);
         this.loadPageData();
    }
  }
}
