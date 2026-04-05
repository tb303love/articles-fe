import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderListItem } from './order-list-item';

describe('OrderListItem', () => {
  let component: OrderListItem;
  let fixture: ComponentFixture<OrderListItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderListItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderListItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
