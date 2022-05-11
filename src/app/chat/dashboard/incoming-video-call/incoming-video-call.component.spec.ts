import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomingVideoCallComponent } from './incoming-video-call.component';

describe('IncomingVideoCallComponent', () => {
  let component: IncomingVideoCallComponent;
  let fixture: ComponentFixture<IncomingVideoCallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IncomingVideoCallComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IncomingVideoCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
