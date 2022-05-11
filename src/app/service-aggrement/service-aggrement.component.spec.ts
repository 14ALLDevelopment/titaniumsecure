import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceAggrementComponent } from './service-aggrement.component';

describe('ServiceAggrementComponent', () => {
  let component: ServiceAggrementComponent;
  let fixture: ComponentFixture<ServiceAggrementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServiceAggrementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAggrementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
