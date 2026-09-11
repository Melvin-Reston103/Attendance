import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteStudentModal } from './delete-student-modal';

describe('DeleteStudentModal', () => {
  let component: DeleteStudentModal;
  let fixture: ComponentFixture<DeleteStudentModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteStudentModal],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteStudentModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
