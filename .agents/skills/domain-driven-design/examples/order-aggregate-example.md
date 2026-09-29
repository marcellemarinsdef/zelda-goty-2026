# Complete DDD Aggregate Example: Order Management

This example demonstrates a complete, production-grade Aggregate in TypeScript implementing complex business invariants, Value Objects, an internal Entity, and Domain Events.

---

## 1. Value Objects

### `Money` Value Object
```typescript
// src/modules/orders/domain/value-objects/money.vo.ts
export class Money {
  public readonly amount: number;
  public readonly currency: string;

  private constructor(amount: number, currency = 'USD') {
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency.toUpperCase();
  }

  public static create(amount: number, currency = 'USD'): Money {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    return new Money(amount, currency);
  }

  public static zero(currency = 'USD'): Money {
    return new Money(0, currency);
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) throw new Error('Multiplier cannot be negative');
    return new Money(this.amount * factor, this.currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  public equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

---

## 2. Internal Entity (Non-Root)

### `OrderItem` Entity
```typescript
// src/modules/orders/domain/entities/order-item.entity.ts
import { Money } from '../value-objects/money.vo';

export class OrderItem {
  public readonly id: string;
  public readonly productId: string;
  public readonly unitPrice: Money;
  private _quantity: number;

  constructor(id: string, productId: string, unitPrice: Money, quantity: number) {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Quantity must be a positive integer');
    }
    this.id = id;
    this.productId = productId;
    this.unitPrice = unitPrice;
    this._quantity = quantity;
  }

  public get quantity(): number {
    return this._quantity;
  }

  public get subtotal(): Money {
    return this.unitPrice.multiply(this._quantity);
  }

  public increaseQuantity(amount: number): void {
    if (amount <= 0) throw new Error('Increase amount must be positive');
    this._quantity += amount;
  }
}
```

---

## 3. Domain Event

```typescript
// src/modules/orders/domain/events/order-confirmed.event.ts
export class OrderConfirmedEvent {
  public readonly eventName = 'OrderConfirmedEvent';
  public readonly occurredOn = new Date();
  public readonly eventId = crypto.randomUUID();

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
  ) {}
}
```

---

## 4. The Aggregate Root

### `Order` Aggregate
```typescript
// src/modules/orders/domain/entities/order.aggregate.ts
import { Money } from '../value-objects/money.vo';
import { OrderItem } from './order-item.entity';
import { OrderConfirmedEvent } from '../events/order-confirmed.event';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED',
}

export class Order {
  public readonly id: string;
  public readonly customerId: string; // References external aggregate by ID only
  private _status: OrderStatus;
  private _items: OrderItem[] = [];
  private _domainEvents: any[] = [];

  private constructor(id: string, customerId: string) {
    this.id = id;
    this.customerId = customerId;
    this._status = OrderStatus.DRAFT;
  }

  public static create(customerId: string): Order {
    if (!customerId) throw new Error('Customer ID is required to create an order');
    return new Order(crypto.randomUUID(), customerId);
  }

  public get status(): OrderStatus { return this._status; }
  public get items(): ReadonlyArray<OrderItem> { return [...this._items]; }
  public get domainEvents(): ReadonlyArray<any> { return [...this._domainEvents]; }

  public get total(): Money {
    return this._items.reduce(
      (acc, item) => acc.add(item.subtotal),
      Money.zero()
    );
  }

  // --- Invariant Guarded Operations ---

  public addItem(productId: string, unitPrice: Money, quantity: number): void {
    if (this._status !== OrderStatus.DRAFT) {
      throw new Error('Cannot add items to an order that is not in DRAFT status');
    }

    if (this._items.length >= 50) {
      throw new Error('Order cannot exceed 50 distinct items');
    }

    const existing = this._items.find((item) => item.productId === productId);
    if (existing) {
      existing.increaseQuantity(quantity);
    } else {
      this._items.push(new OrderItem(crypto.randomUUID(), productId, unitPrice, quantity));
    }
  }

  public confirm(): void {
    if (this._status !== OrderStatus.DRAFT) {
      throw new Error('Only DRAFT orders can be confirmed');
    }

    if (this._items.length === 0) {
      throw new Error('Cannot confirm an empty order');
    }

    if (this.total.amount < 10) {
      throw new Error('Order total must be at least $10.00 to confirm');
    }

    this._status = OrderStatus.CONFIRMED;

    // Emit event
    this._domainEvents.push(
      new OrderConfirmedEvent(this.id, this.customerId, this.total.amount)
    );
  }

  public cancel(reason: string): void {
    if (this._status === OrderStatus.SHIPPED) {
      throw new Error('Cannot cancel an order that has already shipped');
    }
    if (this._status === OrderStatus.CANCELLED) {
      throw new Error('Order is already cancelled');
    }

    this._status = OrderStatus.CANCELLED;
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
```

---

## 5. Pure Unit Test for Invariants

Notice that this unit test requires **zero database connections**, mocks, or HTTP servers:

```typescript
// test/domain/order.aggregate.spec.ts
import { Order, OrderStatus } from '../../src/modules/orders/domain/entities/order.aggregate';
import { Money } from '../../src/modules/orders/domain/value-objects/money.vo';

describe('Order Aggregate Root', () => {
  it('should calculate total and emit event on confirmation', () => {
    const order = Order.create('cust_123');

    order.addItem('prod_A', Money.create(15.5), 2); // 31.00
    order.addItem('prod_B', Money.create(9.0), 1);  // 9.00

    expect(order.total.amount).toBe(40.0);

    order.confirm();

    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(order.domainEvents).toHaveLength(1);
    expect(order.domainEvents[0].eventName).toBe('OrderConfirmedEvent');
    expect(order.domainEvents[0].totalAmount).toBe(40.0);
  });

  it('should reject confirmation if minimum order amount is not met', () => {
    const order = Order.create('cust_123');
    order.addItem('prod_A', Money.create(5.0), 1); // 5.00 < 10.00 minimum

    expect(() => order.confirm()).toThrow('Order total must be at least $10.00');
  });

  it('should not allow cancelling an already shipped order', () => {
    const order = Order.create('cust_123');
    (order as any)._status = OrderStatus.SHIPPED;

    expect(() => order.cancel('Customer changed mind')).toThrow(
      'Cannot cancel an order that has already shipped'
    );
  });
});
```
