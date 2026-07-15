import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseComponent } from '../../../../../../base.component';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { InvoiceService } from '../../../../../../services/invoice.service';
import { CommonModule } from '@angular/common';
import { InvoiceSM } from '../../../../../../models/service-models/app/v1/invoice-s-m';
import { CustomerAddressDetailSM } from '../../../../../../models/service-models/app/v1/customer-address-detail-s-m';
import { ProductUtils } from '../../../../../../utils/product.utils';

@Component({
  selector: 'app-invoice-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.scss',
  standalone: true
})
export class InvoiceDetailComponent extends BaseComponent<any> implements OnInit {
  protected _logHandler: LogHandlerService;
  invoice?: InvoiceSM;
  loading = false;
  error = '';
  @ViewChild('invoicePrintArea') invoicePrintArea?: ElementRef<HTMLElement>;

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private invoiceService: InvoiceService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = {};
  }

  async ngOnInit() {
    const invoiceNumber = this.route.snapshot.paramMap.get('invoiceNumber');
    const orderId = this.route.snapshot.paramMap.get('orderId');
    
    if (invoiceNumber) {
      await this.loadInvoiceByNumber(invoiceNumber);
    } else if (orderId) {
      await this.loadInvoiceByOrderId(parseInt(orderId));
    } else {
      this.error = 'Invalid invoice identifier';
    }
  }

  async loadInvoiceByNumber(invoiceNumber: string) {
    try {
      this.loading = true;
      this._commonService.presentLoading();
      
      const response = await this.invoiceService.getInvoiceByNumber(invoiceNumber);
      
      if (response.isError) {
        this.error = response.errorData?.displayMessage || 'Failed to load invoice';
        await this._logHandler.logObject(response.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: this.error,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        this.invoice = response.successData;
      }
    } catch (error: any) {
      this.error = error.message || 'An error occurred';
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: this.error,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      this.loading = false;
      this._commonService.dismissLoader();
    }
  }

  async loadInvoiceByOrderId(orderId: number) {
    try {
      this.loading = true;
      this._commonService.presentLoading();
      
      const response = await this.invoiceService.getInvoiceByOrderId(orderId);
      
      if (response.isError) {
        this.error = response.errorData?.displayMessage || 'Failed to load invoice';
        await this._logHandler.logObject(response.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: this.error,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        this.invoice = response.successData;
      }
    } catch (error: any) {
      this.error = error.message || 'An error occurred';
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: this.error,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      this.loading = false;
      this._commonService.dismissLoader();
    }
  }

  printInvoice() {
    const invoiceElement = this.invoicePrintArea?.nativeElement;
    if (!invoiceElement) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Invoice content not available for printing.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      this._commonService.showSweetAlertToast({
        title: 'Popup blocked',
        text: 'Please allow popups to print the invoice.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const styleTags = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((node) => (node as HTMLElement).outerHTML)
      .join('\n');

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice ${this.invoice?.invoiceNumber || ''}</title>
          ${styleTags}
          <style>
            body { margin: 0; padding: 20px; background: #fff; }
            .print-root { max-width: 1100px; margin: 0 auto; }
            .btn, .d-flex.justify-content-between { display: none !important; }
            .card { border: none !important; box-shadow: none !important; }
            .invoice-address-block .invoice-address-line {
              display: block !important;
              margin: 0 0 4px 0;
              line-height: 1.45;
              white-space: normal;
              word-break: break-word;
            }
            .invoice-address-block {
              max-width: 420px;
            }
          </style>
        </head>
        <body>
          <div class="print-root">${invoiceElement.outerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 300);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatCurrency(amount: string | number | undefined): string {
    if (!amount) return '₹0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN')}`;
  }

  formatVariantUnit(item: any): string {
    const d = item?.variantDetails;
    const unit = (d?.unitSymbol ?? d?.unitName ?? '').toString();
    return unit || 'N/A';
  }

  formatVariantWeight(item: any): string {
    const d = item?.variantDetails;
    const v = item?.variant;
    return ProductUtils.getDisplayUnit({ ...d, ...v }) || 'N/A';
  }

  /** Lines for Bill To address — each prints on its own row for readability */
  get invoiceAddressLines(): string[] {
    const raw = this.invoice?.customer?.address;
    if (!raw) return [];
    const addr = raw as CustomerAddressDetailSM;

    const lines: string[] = [];
    const pushTrimmed = (s: string | undefined) => {
      const t = (s ?? '').trim();
      if (t) lines.push(t);
    };

    let line1 = (addr.addressLine1 ?? '').trim();
    // Long single-field addresses often arrive comma-separated — split for printing
    if (line1.length > 55 && line1.includes(',')) {
      line1
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((p) => lines.push(p));
    } else if (line1) {
      lines.push(line1);
    }

    pushTrimmed(addr.addressLine2);

    const city = (addr.city ?? '').trim();
    const state = (addr.state ?? '').trim();
    const postal = (addr.postalCode ?? '').trim();
    const cityState = [city, state].filter(Boolean).join(', ');
    if (cityState && postal) {
      lines.push(`${cityState} - ${postal}`);
    } else if (cityState) {
      lines.push(cityState);
    } else if (postal) {
      lines.push(postal);
    }

    pushTrimmed(addr.country);

    return lines;
  }
}

