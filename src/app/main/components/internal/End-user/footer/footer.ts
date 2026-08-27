import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StorefrontContentService } from '../../../../../services/storefront-content.service';

@Component({
  selector: 'app-footer',
  imports: [RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer implements OnInit {
  showWellness = false;
  showJournal = false;
  showGiftHampers = false;

  constructor(private storefrontContent: StorefrontContentService) {}

  async ngOnInit(): Promise<void> {
    await this.storefrontContent.ensureLoaded();
    this.showWellness = this.storefrontContent.showMedia;
    this.showJournal = this.storefrontContent.showJournal;
    this.showGiftHampers = this.storefrontContent.showGiftHampers;
  }
}
