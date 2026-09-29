---
name: domain-driven-design
description: >-
  Expert guidelines, tactical patterns, and strategic principles for implementing Domain-Driven Design (DDD)
  in TypeScript and modern software systems. Use when designing Ubiquitous Language, Bounded Contexts,
  Aggregates, Aggregate Roots, Entities, Value Objects, Domain Events, Domain Services,
  enforcing business invariants, or implementing Anti-Corruption Layers (ACL).
---

# Domain-Driven Design (DDD) in TypeScript

This skill provides practical principles, tactical patterns, and strategic design guidance for building complex, domain-centric software systems using Domain-Driven Design (DDD) in TypeScript and Node.js.

---

## 1. The Two Pillars of DDD

DDD is split into two interconnected disciplines:

1. **Strategic Design (The Macro View)**:
   - Defining **Bounded Contexts** (linguistic and conceptual boundaries).
   - Establishing a shared **Ubiquitous Language** with domain experts.
   - Mapping relationships between contexts (**Context Mapping**: Anti-Corruption Layer, Shared Kernel, Customer/Supplier).
   - Categorizing subdomains: **Core Domain** (competitive advantage), **Supporting Subdomain**, and **Generic Subdomain**.

2. **Tactical Design (The Micro View / Code Level)**:
   - **Value Objects**: Immutable objects defined by their values, with no conceptual identity.
   - **Entities**: Objects possessing unique identity and lifecycle that protect business rules.
   - **Aggregates & Aggregate Roots**: Clusters of entities and value objects treated as a single transactional consistency boundary.
   - **Domain Events**: Explicit, immutable records of state changes that domain experts care about.
   - **Domain Services**: Stateless operations that coordinate multiple domain objects when the logic doesn't naturally fit inside a single Aggregate.
   - **Repositories**: Collection-oriented abstractions providing persistence strictly for **Aggregate Roots**.

---

## 2. Tactical Building Blocks: Quick Reference

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          AGGREGATE ROOT                                │
│  (e.g., Order: holds ID, manages lifecycle, records Domain Events)     │
│                                                                        │
│   ┌──────────────────────────┐      ┌──────────────────────────────┐   │
│   │     Internal Entity      │      │        Value Objects         │   │
│   │ (e.g., OrderItem: id)    │      │ (e.g., Money, OrderStatus)   │   │
│   └──────────────────────────┘      └──────────────────────────────┘   │
│                 ▲                                  ▲                   │
│                 └──────── Transaction Boundary ────┘                   │
│                                                                        │
│   Invariants: Total price >= $10.00; Max 50 items; Status transitions │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Emits upon mutation
                                    ▼
                         ┌────────────────────┐
                         │   Domain Events    │
                         │(OrderPlacedEvent)  │
                         └────────────────────┘
```

### Golden Rules of Aggregates:
1. **Reference Other Aggregates Exclusively by ID**: Never hold a direct object reference to another aggregate root.
2. **One Repository per Aggregate Root**: Never create a repository for an internal entity (e.g., no `OrderItemRepository`; only `OrderRepository`).
3. **Protect Business Invariants Internally**: External callers cannot modify internal entities or fields directly; all mutations happen via methods on the Aggregate Root.
4. **Modify One Aggregate per Transaction**: If an operation needs to mutate multiple aggregates, use eventual consistency via Domain Events.

---

## 3. Workflow: Modeling and Implementing an Aggregate

When building a new business feature using DDD:

### Step 1: Discover Ubiquitous Language & Invariants
- Identify business terms directly with domain experts (avoid technical jargon like "UserRecord", "OrderRow").
- List explicit rules and invariants (e.g., *"An order cannot be cancelled if it has already been shipped"*).

### Step 2: Model Value Objects First
- Identify concepts where identity does not matter (e.g., `Money`, `Email`, `SKU`, `Address`, `DateRange`).
- Make them **immutable**, enforce self-validation in factory methods, and provide value-equality checks.

### Step 3: Model the Aggregate Root
- Inherit from or implement an `AggregateRoot<TId>` base class.
- Keep constructors private and expose static creation methods (e.g., `Order.create(...)`).
- Encapsulate internal collections using read-only getters.
- Raise **Domain Events** internally whenever significant domain mutations occur (e.g., `this.addDomainEvent(new OrderPlacedEvent(...))`).

### Step 4: Define the Repository Port
- Place the interface in the domain or application layer.
- Ensure methods speak ubiquitous language: `save(aggregate)`, `findById(id)`, `delete(aggregate)`.

### Step 5: Handle Domain Events & Side Effects
- Dispatch recorded domain events upon successful repository persistence (Outbox Pattern or Unit of Work).
- React to events in separate handlers/subscribers to keep business concerns decoupled.

---

## 4. Integration with Clean Architecture

DDD tactical patterns fit naturally into Clean Architecture:

| DDD Element | Clean Architecture Layer | Location |
| :--- | :--- | :--- |
| Entities, Aggregates, Value Objects, Domain Events | **Domain** | `src/modules/<feature>/domain/` |
| Domain Services, Specifications | **Domain** | `src/modules/<feature>/domain/services/` |
| Repository Interfaces (Ports) | **Domain / Application** | `src/modules/<feature>/domain/repositories/` |
| Use Cases (Orchestrating Aggregates) | **Application** | `src/modules/<feature>/application/use-cases/` |
| Event Subscribers / Handlers | **Application / Infrastructure** | `src/modules/<feature>/application/subscribers/` |
| Repository Implementations (Prisma/TypeORM) | **Infrastructure** | `src/modules/<feature>/infrastructure/database/` |
| Anti-Corruption Layer (ACL) Translators | **Infrastructure** | `src/modules/<feature>/infrastructure/acl/` |

---

## 5. Detailed References & Examples

- [Strategic Design & Context Mapping](./references/strategic-design.md): Bounded Contexts, Subdomains, and integration patterns (ACL, Shared Kernel).
- [Tactical Patterns Deep-Dive](./references/tactical-patterns.md): Base classes (`Entity`, `ValueObject`, `AggregateRoot`), encapsulation, and equality rules.
- [Domain Events & Transactional Outbox](./references/domain-events-and-outbox.md): Event lifecycle, decoupling side effects, and guaranteeing reliable delivery.
- [Complete Aggregate Example](./examples/order-aggregate-example.md): Production-ready TypeScript code featuring an `Order` aggregate with Value Objects, internal entities, business invariants, and domain events.
