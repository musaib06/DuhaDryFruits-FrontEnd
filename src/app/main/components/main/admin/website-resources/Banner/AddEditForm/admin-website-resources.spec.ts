import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWebsiteResources } from './admin-website-resources';

describe('AdminWebsiteResources', () => {
  let component: AdminWebsiteResources;
  let fixture: ComponentFixture<AdminWebsiteResources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWebsiteResources]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminWebsiteResources);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
