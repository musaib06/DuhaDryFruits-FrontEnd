import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { Header } from '../../../internal/End-user/header/header';
import { Footer } from '../../../internal/End-user/footer/footer';
import { CategoryService } from '../../../../../services/category.service';
import { CategorySM } from '../../../../../models/service-models/app/v1/categories-s-m';
import { closestProtectedAssetImage } from './asset-protection';

@Component({
  selector: 'app-end-user-layout',
  imports: [RouterModule, RouterOutlet, Header, Footer, CommonModule],
  templateUrl: './end-user-layout.html',
  styleUrl: './end-user-layout.scss',
})
export class EndUserLayout implements OnInit, OnDestroy {
  categories: CategorySM[] = [];
  categorySheetOpen = false;
  private readonly isBrowser: boolean;

  private onDragStart = (event: DragEvent) => {
    if (closestProtectedAssetImage(event.target)) {
      event.preventDefault();
    }
  };

  private onSelectStart = (event: Event) => {
    if (closestProtectedAssetImage(event.target)) {
      event.preventDefault();
    }
  };

  private onCopy = (event: ClipboardEvent) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const node = sel.anchorNode;
    const el =
      node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement;
    if (el?.closest('img.duha-protect-asset')) {
      event.preventDefault();
    }
  };

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      document.addEventListener('dragstart', this.onDragStart, true);
      document.addEventListener('selectstart', this.onSelectStart, true);
      document.addEventListener('copy', this.onCopy, true);
      // FAB categories are client-only — header already loads categories for SSR nav.
      // Defer so home banners/products get the network first.
      this.scheduleFabCategoryLoad();
    }
  }

  private scheduleFabCategoryLoad(): void {
    const run = () => void this.loadCategoriesForFab();
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run, { timeout: 3500 });
    } else {
      setTimeout(run, 1800);
    }
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) {
      return;
    }
    document.removeEventListener('dragstart', this.onDragStart, true);
    document.removeEventListener('selectstart', this.onSelectStart, true);
    document.removeEventListener('copy', this.onCopy, true);
  }

  private async loadCategoriesForFab(): Promise<void> {
    const resp = await this.categoryService.getStorefrontCategories(200);
    if (!resp.isError && resp.successData) {
      this.categories = [...resp.successData].sort((a, b) => {
        const as = Number(a.sequence ?? 0);
        const bs = Number(b.sequence ?? 0);
        if (as !== bs) return as - bs;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
    }
  }

  closeCategorySheet(): void {
    this.categorySheetOpen = false;
  }

  openCategory(cat: CategorySM): void {
    this.categorySheetOpen = false;
    void this.router.navigate(['/buy-dry-fruits', cat.name, cat.id]);
  }

  goAllProducts(): void {
    this.categorySheetOpen = false;
    void this.router.navigate(['/buy-dry-fruits']);
  }

  /** Right-click “Save image” — only blocked on marked catalog / product / promo images */
  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent): void {
    if (!this.isBrowser) {
      return;
    }
    if (closestProtectedAssetImage(event.target)) {
      event.preventDefault();
    }
  }
}
