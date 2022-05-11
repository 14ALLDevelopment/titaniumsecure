import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatActionDropdownComponent } from './chat-action-dropdown.component';

describe('ChatActionDropdownComponent', () => {
  let component: ChatActionDropdownComponent;
  let fixture: ComponentFixture<ChatActionDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChatActionDropdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatActionDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
