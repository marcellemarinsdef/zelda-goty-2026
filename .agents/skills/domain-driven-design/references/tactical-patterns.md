# Tactical Patterns Deep-Dive in TypeScript

Tactical DDD provides concrete patterns for building expressive, rich domain models that protect business invariants.

---

## 1. Tactical Foundation Base Classes

Reusable TypeScript abstract classes establish consistent behavior across all domain building blocks.

### The Value Object Base Class
Value Objects have no identity. Two Value Objects are equal if all their properties are equal.

```typescript
// src/core/domain/value-object.base.ts
export abstract class ValueObject<TProps> {
  protected readonly props: Readonly<TProps>;

  constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  public equals(vo?: ValueObject<TProps>): boolean {
    if (vo === null || vo === undefined) return false;
    if (vo.props === undefined) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
```

### The Entity Base Class
Entities possess an explicit identity (`id`). Two Entities are equal if and only if their IDs match, regardless of other property changes.

```typescript
// src/core/domain/entity.base.ts
export abstract class Entity<TId> {
  protected readonly _id: TId;

  constructor(id: TId) {
    this._id = id;
  }

  public get id(): TId {
    return this._id;
  }

  public equals(other?: Entity<TId>): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }
}
```

### The Aggregate Root Base Class
An Aggregate Root is an Entity that serves as the entry point to the aggregate boundary and collects Domain Events.

```typescript
// src/core/domain/aggregate-root.base.ts
import { Entity } from './entity.base';
import { IDomainEvent } from './domain-event.interface';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: IDomainEvent[] = [];

  public get domainEvents(): ReadonlyArray<IDomainEvent> {
    return Object.freeze([...this._domainEvents]);
  }

  protected addDomainEvent(domainEvent: IDomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
```

---

## 2. Aggregates and Invariant Protection

An **Aggregate** is a cluster of associated objects (entities and value objects) that are treated as a unit for the purpose of data changes.

### Essential Rules for Designing Aggregates

#### Rule 1: Guard Invariants at the Root
External callers should never reach into an aggregate to mutate its child entities. All operations pass through the Aggregate Root.

```typescript
// ❌ WRONG: Exposing mutable collection allows bypassing invariants
const order = await orderRepo.findById(id);
order.items.push(new OrderItem(...)); // Invariants broken! Total not updated!

// ✅ CORRECT: Mutate strictly through Aggregate Root method
order.addItem(product, quantity); // Updates total, checks max limit, raises event
```

#### Rule 2: Keep Collections Read-Only
Always return a copy or a `ReadonlyArray` when exposing child entities:

```typescript
export class Order extends AggregateRoot<string> {
  private _items: OrderItem[] = [];

  // Expose as read-only view
  public get items(): ReadonlyArray<OrderItem> {
    return [...this._items];
  }
}
```

#### Rule 3: Reference Other Aggregates by ID Only
Do NOT hold direct object references to other Aggregate Roots.

```typescript
// ❌ WRONG: Direct object reference ties two aggregates together in memory/transactions
export class Order extends AggregateRoot<string> {
  private customer: Customer; // Couples Order aggregate to Customer aggregate
}

// ✅ CORRECT: Reference by ID
export class Order extends AggregateRoot<string> {
  private readonly customerId: CustomerId; // Loose coupling
}
```

#### Rule 4: One Aggregate per Transaction
A database transaction should commit changes to **only one** Aggregate Root.
- If Aggregate A needs to trigger a change in Aggregate B, use **Domain Events** and eventual consistency rather than wrapping both in a single monolithic ACID transaction.

---

## 3. Domain Services vs Application Services

Do not confuse Domain Services with Application Use Cases.

| Dimension | Domain Service | Application Service (Use Case) |
| :--- | :--- | :--- |
| **Purpose** | Pure business calculation/rule spanning multiple domain objects. | Orchestrates workflow, transactions, security, repositories. |
| **I/O & Dependencies** | Pure domain logic. No network, no DB, no third-party APIs. | Calls DB repositories, external APIs, dispatchers. |
| **Example** | `TransferFundsDomainService.execute(sourceAcc, targetAcc, amount)` | `TransferFundsUseCase.execute(inputDTO)` |
