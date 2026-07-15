import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundAndReturnPolicy } from './refund-and-return-policy';

describe('RefundAndReturnPolicy', () => {
  let component: RefundAndReturnPolicy;
  let fixture: ComponentFixture<RefundAndReturnPolicy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundAndReturnPolicy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundAndReturnPolicy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
