import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebglScreenSaver } from './webgl-screen-saver';

describe('WebglScreenSaver', () => {
  let component: WebglScreenSaver;
  let fixture: ComponentFixture<WebglScreenSaver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebglScreenSaver]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebglScreenSaver);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
