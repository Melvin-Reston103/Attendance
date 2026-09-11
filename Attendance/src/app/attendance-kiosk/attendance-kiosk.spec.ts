import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceKiosk } from './attendance-kiosk';

describe('AttendanceKiosk', () => {
  let component: AttendanceKiosk;
  let fixture: ComponentFixture<AttendanceKiosk>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceKiosk],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceKiosk);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
