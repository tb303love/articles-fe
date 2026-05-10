import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AdbStatusModal} from './adb-status-modal';

describe('AdbStatusModal', () => {
  let component: AdbStatusModal;
  let fixture: ComponentFixture<AdbStatusModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdbStatusModal]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdbStatusModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
