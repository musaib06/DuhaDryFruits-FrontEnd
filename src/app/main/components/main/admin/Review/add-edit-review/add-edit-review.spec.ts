import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditReview } from './add-edit-review';

describe('AddEditReview', () => {
  let component: AddEditReview;
  let fixture: ComponentFixture<AddEditReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditReview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditReview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
