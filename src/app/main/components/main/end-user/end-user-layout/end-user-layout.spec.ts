import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndUserLayout } from './end-user-layout';

describe('EndUserLayout', () => {
  let component: EndUserLayout;
  let fixture: ComponentFixture<EndUserLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EndUserLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EndUserLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
