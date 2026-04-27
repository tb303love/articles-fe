import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsbStatusModal } from './usb-status-modal';

describe('UsbStatusModal', () => {
  let component: UsbStatusModal;
  let fixture: ComponentFixture<UsbStatusModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsbStatusModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsbStatusModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
