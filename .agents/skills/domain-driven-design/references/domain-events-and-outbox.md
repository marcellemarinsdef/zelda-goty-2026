# Domain Events and the Transactional Outbox Pattern

Domain Events capture business occurrences that have taken place in the past. They enable decoupled architectures, audit trails, and eventual consistency across Bounded Contexts.

---

## 1. Modeling Domain Events

### Contract
A Domain Event must be immutable and named in the **past tense** (e.g., `OrderPlacedEvent`, `PaymentReceivedEvent`, `MemberBannedEvent`).

```typescript
// src/core/domain/domain-event.interface.ts
export interface IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName: string;
}
```

### Example Implementation
```typescript
// src/modules/orders/domain/events/order-placed.event.ts
import { IDomainEvent } from '../../../../core/domain/domain-event.interface';
import { Money } from '../value-objects/money.vo';

export class OrderPlacedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventName = 'OrderPlacedEvent';

  constructor(
    public readonly aggregateId: string, // orderId
    public readonly customerId: string,
    public readonly totalAmount: Money,
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
  }
}
```

---

## 2. Raising and Collecting Events in the Aggregate

The Aggregate Root records the event internally when state changes:

```typescript
// src/modules/orders/domain/entities/order.aggregate.ts
export class Order extends AggregateRoot<string> {
  public placeOrder(): void {
    if (this._status !== OrderStatus.Draft) {
      throw new Error('Only draft orders can be placed');
    }

    this._status = OrderStatus.Placed;

    // Raise domain event
    this.addDomainEvent(
      new OrderPlacedEvent(this.id, this.customerId, this.totalAmount)
    );
  }
}
```

---

## 3. The Dual-Write Problem & The Transactional Outbox Pattern

### The Trap: Dual-Write Failure
If you save the aggregate in PostgreSQL and then immediately call `kafka.publish()`, one of them will eventually fail:
- If DB commits, but network to Kafka fails $\rightarrow$ Event lost, downstream services never know.
- If Kafka message sends, but DB commit rolls back $\rightarrow$ Phantom event dispatched for non-existent data.

```text
❌ DUAL-WRITE HAZARD:
Use Case ───► DB.save(Order) ───[OK]
         └──► Kafka.publish()  ───[NETWORK TIMEOUT / CRASH] 💥 (Desynchronization)
```

### The Solution: Transactional Outbox Pattern
Write the Aggregate changes AND an Outbox record into the **same database transaction**:

```text
✅ TRANSACTIONAL OUTBOX:
Use Case ───► [BEGIN DB TRANSACTION]
                ├── INSERT INTO orders (...)
                └── INSERT INTO outbox_messages (id, event_name, payload, status = 'PENDING')
              [COMMIT TRANSACTION] (100% Guaranteed atomic)

Background Worker (or CDC/Debezium) ──► Polls 'PENDING' outbox records
                                    ──► Publishes to RabbitMQ / Kafka / Redis
                                    ──► Updates status to 'PROCESSED'
```

---

## 4. Prisma Outbox Implementation Example

```typescript
// src/modules/orders/infrastructure/database/repositories/prisma-order.repository.ts
import { PrismaClient } from '@prisma/client';
import { Order } from '../../../domain/entities/order.aggregate';
import { IOrderRepository } from '../../../domain/repositories/order-repository.port';

export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: Order): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Persist aggregate state
      await tx.order.upsert({
        where: { id: order.id },
        create: {
          id: order.id,
          customerId: order.customerId,
          status: order.status,
          totalAmount: order.totalAmount.amount,
        },
        update: {
          status: order.status,
          totalAmount: order.totalAmount.amount,
        },
      });

      // 2. Persist domain events to outbox table
      for (const event of order.domainEvents) {
        await tx.outboxMessage.create({
          data: {
            id: event.eventId,
            aggregateId: event.aggregateId,
            eventName: event.eventName,
            payload: JSON.stringify(event),
            status: 'PENDING',
            createdAt: event.occurredOn,
          },
        });
      }
    });

    // 3. Clear events from the in-memory aggregate
    order.clearDomainEvents();
  }
}
```
