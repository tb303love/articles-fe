import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericDialogEntry } from './generic-dialog-entry';

describe('GenericDialogEntry', () => {
  let component: GenericDialogEntry;
  let fixture: ComponentFixture<GenericDialogEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericDialogEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericDialogEntry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
