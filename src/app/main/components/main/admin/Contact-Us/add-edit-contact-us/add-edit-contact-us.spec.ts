import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditContactUs } from './add-edit-contact-us';

describe('AddEditContactUs', () => {
  let component: AddEditContactUs;
  let fixture: ComponentFixture<AddEditContactUs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditContactUs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditContactUs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
