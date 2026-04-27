import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitialStocks } from './initial-stocks';

describe('InitialStocks', () => {
  let component: InitialStocks;
  let fixture: ComponentFixture<InitialStocks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InitialStocks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InitialStocks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
