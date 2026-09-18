import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAdminModal } from './add-admin-modal';

describe('AddAdminModal', () => {
  let component: AddAdminModal;
  let fixture: ComponentFixture<AddAdminModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAdminModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAdminModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
