import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCategoryForm } from './admin-category-form';

describe('AdminCategoryForm', () => {
  let component: AdminCategoryForm;
  let fixture: ComponentFixture<AdminCategoryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoryForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCategoryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
