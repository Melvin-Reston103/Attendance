import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactionAverageModal } from './faction-average-modal';

describe('FactionAverageModal', () => {
  let component: FactionAverageModal;
  let fixture: ComponentFixture<FactionAverageModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactionAverageModal],
    }).compileComponents();

    fixture = TestBed.createComponent(FactionAverageModal);
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('selectedDate', '2026-09-24');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
