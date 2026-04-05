import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportErrorsDialog } from './import-errors-dialog';

describe('ImportErrorsDialog', () => {
  let component: ImportErrorsDialog;
  let fixture: ComponentFixture<ImportErrorsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportErrorsDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportErrorsDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
