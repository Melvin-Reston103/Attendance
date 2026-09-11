import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceLogs } from './attendance-logs';

describe('AttendanceLogs', () => {
  let component: AttendanceLogs;
  let fixture: ComponentFixture<AttendanceLogs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceLogs],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceLogs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
