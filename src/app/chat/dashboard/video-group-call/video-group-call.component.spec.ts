import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoGroupCallComponent } from './video-group-call.component';

describe('VideoGroupCallComponent', () => {
  let component: VideoGroupCallComponent;
  let fixture: ComponentFixture<VideoGroupCallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoGroupCallComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoGroupCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
