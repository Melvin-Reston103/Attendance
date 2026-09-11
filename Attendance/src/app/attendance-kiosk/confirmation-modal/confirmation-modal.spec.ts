import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationModal } from './confirmation-modal';
import { SAMPLE_ATTENDANCE_RECORD } from '../attendance-record';

describe('ConfirmationModal', () => {
  let component: ConfirmationModal;
  let fixture: ComponentFixture<ConfirmationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationModal);
    fixture.componentRef.setInput('record', SAMPLE_ATTENDANCE_RECORD);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
