import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchExportQrModal } from './batch-export-qr-modal';

describe('BatchExportQrModal', () => {
  let component: BatchExportQrModal;
  let fixture: ComponentFixture<BatchExportQrModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchExportQrModal],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchExportQrModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('students', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
