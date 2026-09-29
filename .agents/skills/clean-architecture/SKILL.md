---
name: clean-architecture
description: >-
  Expert guidelines and procedures for designing, structuring, and refactoring applications
  following Clean Architecture and Hexagonal (Ports & Adapters) principles in TypeScript and Node.js.
  Use when organizing layers (Domain, Application, Adapters, Infrastructure), enforcing the Dependency Rule,
  decoupling business logic from frameworks (Express, Fastify, NestJS, Prisma, TypeORM),
  creating Use Cases, Repositories, Entities, or auditing code for boundary violations.
---

# Clean Architecture in TypeScript & Node.js

This skill guides the design, implementation, and review of scalable, testable, and maintainable software systems following Robert C. Martin's Clean Architecture and Alistair Cockburn's Hexagonal Architecture (Ports & Adapters), specifically tailored for TypeScript and modern Node.js ecosystems (NestJS, Fastify, Express, Prisma, TypeORM).

---

## 1. The Core Principle: The Dependency Rule

> **Source code dependencies must point only inward, toward higher-level policies.**

```text
       ┌────────────────────────────────────────────────────────┐
       │                 4. Frameworks & Drivers                │
       │    (Express, Fastify, NestJS, Prisma, TypeORM, Redis)  │
       │    ┌──────────────────────────────────────────────┐    │
       │    │           3. Interface Adapters              │    │
       │    │    (Controllers, Presenters, Gateways, DTOs) │    │
       │    │    ┌────────────────────────────────────┐    │    │
       │    │    │       2. Application (Use Cases)   │    │    │
       │    │    │    (Interactors, Ports/Interfaces) │    │    │
       │    │    │    ┌──────────────────────────┐    │    │    │
       │    │    │    │        1. Domain         │    │    │    │
       │    │    │    │ (Entities, Value Objects)│    │    │    │
       │    │    │    └──────────────────────────┘    │    │    │
       │    │    └────────────────────────────────────┘    │    │
       │    └──────────────────────────────────────────────┘    │
       └────────────────────────────────────────────────────────┘
```

- **Domain** knows **nothing** about outer layers (no HTTP, no ORM, no SQL, no external SDKs).
- **Application** knows **only Domain**. It defines contracts (Ports) that outer layers must implement.
- **Interface Adapters** convert data between outer formats (HTTP, CLI, DB rows) and Application/Domain formats.
- **Frameworks & Drivers** glue everything together and house concrete tools, DB engines, and web servers.

---

## 2. Standard Directory Layout

When structuring a project or module, follow this canonical layout:

```text
src/
├── core/                         # Shared kernel / base types (optional)
│   ├── entity.base.ts
│   ├── value-object.base.ts
│   └── result.ts
└── modules/<feature>/            # Feature-sliced or Layer-sliced architecture
    ├── domain/                   # 1. Enterprise Business Rules
    │   ├── entities/             # Rich domain models with behavior
    │   ├── value-objects/        # Immutable domain values with validation
    │   ├── events/               # Domain events (e.g., UserRegisteredEvent)
    │   ├── errors/               # Domain-specific error classes
    │   └── services/             # Pure domain logic spanning multiple entities
    │
    ├── application/              # 2. Application Business Rules
    │   ├── use-cases/            # Command / Query handlers (Interactors)
    │   ├── ports/                # Interfaces: Driven (Repositories, Mailer) & Driving
    │   │   ├── repositories/
    │   │   └── services/
    │   └── dtos/                 # Input/Output request & response contracts
    │
    ├── infrastructure/           # 3 & 4. Concrete Adapters & Frameworks
    │   ├── database/             # ORM models, Prisma clients, Repository Impls
    │   │   ├── repositories/     # Implements application/ports/repositories
    │   │   └── mappers/          # Translates ORM records <-> Domain Entities
    │   ├── http/                 # Controllers, Middlewares, Routes
    │   │   ├── controllers/      # Translates HTTP Req -> UseCase Input
    │   │   └── presenters/       # Translates UseCase Output -> HTTP Res
    │   └── external-services/    # Third-party integrations (Stripe, SES, SQS)
    │
    └── index.ts                  # Module composition root / dependency injection
```

---

## 3. Workflow: Implementing a New Feature

When creating a feature (e.g. `RegisterUser`, `ProcessPayment`), follow this strict sequence:

### Step 1: Model the Domain (`domain/`)
1. Create Entities with **private constructors** and static factory methods (e.g., `create()`).
2. Encapsulate business invariants inside the entity or Value Objects.
3. Keep it 100% pure TypeScript: no decorators from TypeORM/Prisma/NestJS inside domain models.

### Step 2: Define Application Ports (`application/ports/`)
1. Define repository and external service interfaces in the application layer.
2. Example: `export interface IUserRepository { findByEmail(email: Email): Promise<User | null>; save(user: User): Promise<void>; }`
3. Define Input and Output DTOs (plain types or interfaces, immutable).

### Step 3: Implement the Use Case (`application/use-cases/`)
1. Inject ports via constructor (Dependency Inversion).
2. Execute business flow: fetch entity -> execute domain operation -> persist via repository -> dispatch events.
3. Return a `Result<TSuccess, TError>` or typed output DTO.

### Step 4: Implement Adapters (`infrastructure/`)
1. **Repository Adapter**: Implements the application port using Prisma/TypeORM/Kysely.
2. **Persistence Mapper**: Implements bidirectional mapping: `toDomain(dbEntity): DomainEntity` and `toPersistence(domainEntity): DbEntity`.
3. **Controller/Handler**: Receives HTTP request, validates input (e.g., Zod, class-validator), executes Use Case, and formats HTTP response.

### Step 5: Wire Dependencies (Composition Root)
1. Instantiate adapters and inject them into use cases.
2. In NestJS: Use modules and `@Inject('IUserRepository')` or custom injection tokens.
3. In Fastify/Express: Use a DI container (e.g., Awilix, TSyringe) or functional factory composition.

---

## 4. Quick Verification Rules (Linter in your Mind)

Before concluding any code change, verify these invariants:

| Violation Rule | Check | Corrective Action |
| :--- | :--- | :--- |
| **No DB imports in Domain/App** | Does `domain/` or `application/` import `@prisma/client`, `typeorm`, or `mongoose`? | Move DB logic to `infrastructure/database/` and create an interface port in `application/ports/`. |
| **No HTTP imports in App/Domain** | Does a Use Case know about `Request`, `Response`, `@Req()`, or `@Res()`? | Extract HTTP parameters in the Controller and pass a plain DTO to the Use Case. |
| **Domain is Rich, not Anemic** | Do entities only have getters and setters with all logic in services? | Move business logic and validation methods directly into the entity / value object. |
| **Bidirectional Mappings Exist** | Is the ORM model returned directly to the HTTP response or passed to use cases? | Use explicit Mappers (`toDomain` and `toPersistence` / `toResponseDTO`). |

---

## 5. Detailed References & Examples

Read these companion guides when implementing specific parts:
- [Layers & Boundaries Detailed Guide](./references/layers-and-boundaries.md): In-depth roles, responsibilities, and isolation rules for each layer.
- [Dependency Inversion & Ports in Node.js](./references/dependency-inversion-and-ports.md): How to wire interfaces, tokens, and DI containers in TypeScript and NestJS.
- [Anti-Patterns & Architectural Checklist](./references/anti-patterns-and-checklist.md): Common Clean Architecture traps and how to avoid them.
- [Complete TypeScript Example](./examples/complete-use-case-ts.md): Full end-to-end code for a concrete feature (Domain, Ports, Use Case, Prisma Adapter, Controller).
