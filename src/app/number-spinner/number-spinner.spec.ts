import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberSpinner } from './number-spinner';

describe('NumberSpinner', () => {
  let component: NumberSpinner;
  let fixture: ComponentFixture<NumberSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberSpinner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumberSpinner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
