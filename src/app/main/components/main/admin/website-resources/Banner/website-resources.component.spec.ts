import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsiteResourcesComponent } from './website-resources.component';

describe('WebsiteResourcesComponent', () => {
  let component: WebsiteResourcesComponent;
  let fixture: ComponentFixture<WebsiteResourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebsiteResourcesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebsiteResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
