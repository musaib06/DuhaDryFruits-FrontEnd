import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditTestimonial } from './add-edit-testimonial';

describe('AddEditTestimonial', () => {
  let component: AddEditTestimonial;
  let fixture: ComponentFixture<AddEditTestimonial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditTestimonial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditTestimonial);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
