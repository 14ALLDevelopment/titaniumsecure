import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionHistoryComponent } from './subscription-history.component';

describe('SubscriptionHistoryComponent', () => {
  let component: SubscriptionHistoryComponent;
  let fixture: ComponentFixture<SubscriptionHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubscriptionHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubscriptionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
