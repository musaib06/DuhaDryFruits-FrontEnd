import { AxiosResponse } from 'axios';
import { Injectable } from '@angular/core';

import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { IDictionaryCollection } from '../../models/internal/Idictionary-collection';
import { DictionaryCollection } from '../../models/internal/dictionary-collection';
import { AppConstants } from '../../../app-constants';


@Injectable({
    providedIn: 'root'
})
export class CommonResponseCodeHandler {//dont extend from base

    public handlerDict: IDictionaryCollection<string, (resp: AxiosResponse) => string>;

    constructor( private router: Router,
        private storageService: StorageService) {
        // add common functions here
        this.handlerDict = new DictionaryCollection<string, (resp: AxiosResponse) => string>();
        this.AddCommonHandlers();
    }

    async AddCommonHandlers() {
        this.handlerDict.Add('401', (resp) => {
            // this.commonService.presentToast(AppConstants.ErrorPrompts.Unauthorized_User);
            this.router.navigate(['home-page']);
            this.storageService.removeFromStorage(AppConstants.DbKeys.ACCESS_TOKEN);
            this.storageService.removeFromSessionStorage(AppConstants.DbKeys.ACCESS_TOKEN);
            return AppConstants.ErrorPrompts.Unauthorized_User;
        });
    }

}
