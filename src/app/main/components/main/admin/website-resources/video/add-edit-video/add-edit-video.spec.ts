import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditVideo } from './add-edit-video';

describe('AddEditVideo', () => {
  let component: AddEditVideo;
  let fixture: ComponentFixture<AddEditVideo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditVideo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditVideo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
