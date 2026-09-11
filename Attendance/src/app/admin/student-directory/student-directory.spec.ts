import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentDirectory } from './student-directory';

describe('StudentDirectory', () => {
  let component: StudentDirectory;
  let fixture: ComponentFixture<StudentDirectory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentDirectory],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentDirectory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
