import { TestBed } from '@angular/core/testing';

import { ScrenSaver } from './scren-saver';

describe('ScrenSaver', () => {
  let service: ScrenSaver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrenSaver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
