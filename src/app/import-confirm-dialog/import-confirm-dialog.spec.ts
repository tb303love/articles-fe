import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportConfirmDialog } from './import-confirm-dialog';

describe('ImportConfirmDialog', () => {
  let component: ImportConfirmDialog;
  let fixture: ComponentFixture<ImportConfirmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportConfirmDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportConfirmDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
