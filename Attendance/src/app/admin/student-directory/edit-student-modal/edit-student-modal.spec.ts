import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditStudentModal } from './edit-student-modal';

describe('EditStudentModal', () => {
  let component: EditStudentModal;
  let fixture: ComponentFixture<EditStudentModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStudentModal],
    }).compileComponents();

    fixture = TestBed.createComponent(EditStudentModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
