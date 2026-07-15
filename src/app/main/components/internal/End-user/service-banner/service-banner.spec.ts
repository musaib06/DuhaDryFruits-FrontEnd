import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceBanner } from './service-banner';

describe('ServiceBanner', () => {
  let component: ServiceBanner;
  let fixture: ComponentFixture<ServiceBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
