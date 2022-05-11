import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionCancelComponent } from './subscription-cancel.component';

describe('SubscriptionCancelComponent', () => {
  let component: SubscriptionCancelComponent;
  let fixture: ComponentFixture<SubscriptionCancelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubscriptionCancelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubscriptionCancelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
