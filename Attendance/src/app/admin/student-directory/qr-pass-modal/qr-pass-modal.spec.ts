import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrPassModal } from './qr-pass-modal';

describe('QrPassModal', () => {
  let component: QrPassModal;
  let fixture: ComponentFixture<QrPassModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrPassModal],
    }).compileComponents();

    fixture = TestBed.createComponent(QrPassModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
