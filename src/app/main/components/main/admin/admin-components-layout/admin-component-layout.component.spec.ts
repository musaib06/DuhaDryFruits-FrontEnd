import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminComponentLayoutComponent } from './admin-component-layout.component';

describe('AdminComponentLayoutComponent', () => {
  let component: AdminComponentLayoutComponent;
  let fixture: ComponentFixture<AdminComponentLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponentLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminComponentLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
