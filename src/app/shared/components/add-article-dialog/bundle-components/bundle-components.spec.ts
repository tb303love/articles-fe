import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleComponents } from './bundle-components';

describe('BundleComponents', () => {
  let component: BundleComponents;
  let fixture: ComponentFixture<BundleComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BundleComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BundleComponents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
