# Layers and Boundaries in Clean Architecture

This reference details the role, constraints, and responsibilities of each layer in Clean Architecture when developing with TypeScript and Node.js.

---

## 1. Domain Layer (`domain/`)

The Domain layer models the core business logic, policies, and concepts of the enterprise.

### Components
- **Entities**: Objects defined by identity (ID), containing state and mutating methods that protect business invariants.
  - *Rule*: Never expose raw public setters. Invariants must be enforced inside constructor/factory or methods (e.g., `user.activate()`, `order.addItem(...)`).
- **Value Objects**: Immutable objects defined solely by their attributes (e.g., `Email`, `CPF`, `Money`, `PasswordHash`).
  - *Rule*: Validate format upon creation. Two Value Objects with the same attributes are considered identical.
- **Domain Errors**: Strongly-typed errors reflecting business rule violations (e.g., `AccountLockedError`, `InsufficientFundsError`).
- **Domain Services**: Pure business algorithms that involve multiple entities and don't logically belong to a single entity.
  - *Rule*: Must remain stateless and purely domain-focused (no network, no database calls).
- **Domain Events**: Events signaling significant domain occurrences (e.g., `OrderPlacedEvent`).

### Constraints
- Zero external dependencies (only standard language libraries or pure functional utilities).
- No decorator dependencies from ORMs (`@Entity()`, `@Column()`) or HTTP frameworks.
- No asynchronous I/O (no DB queries, HTTP calls).

---

## 2. Application Layer (`application/`)

The Application layer coordinates the execution of business workflows (Use Cases), orchestrating domain objects and ports.

### Components
- **Use Cases (Interactors)**: A single use case implements a single application capability (e.g., `CreateOrderUseCase`, `AuthenticateUserUseCase`).
  - Implements an `execute(dto: InputDTO): Promise<OutputDTO | Result>` method.
  - Coordinates transactions and workflows without holding core domain validation logic.
- **Ports (Interfaces)**:
  - **Driven Ports (Outbound)**: Secondary ports defining contracts for infrastructure services (e.g., `IOrderRepository`, `INotificationGateway`, `IPasswordHasher`, `ITokenGenerator`).
  - **Driving Ports (Inbound)**: Primary ports representing the entry points to the application (often the Use Case interface itself).
- **DTOs (Data Transfer Objects)**: Plain objects/interfaces carrying data across the application boundary.
  - *Rule*: Never pass raw Domain Entities out to the HTTP/UI layer; always map to an Output DTO.

### Constraints
- Depends **only** on the `domain/` layer.
- Must not know how data is stored (PostgreSQL, MongoDB, In-Memory) or how it was delivered (HTTP, gRPC, CLI, Message Queue).

---

## 3. Interface Adapters Layer (`infrastructure/http/`, `infrastructure/database/`)

Adapters bridge the application layer with external technologies. They translate data from the format most convenient for external agencies (HTTP, DB tables) into the format convenient for Use Cases and Entities.

### Inbound Adapters (Driving)
- **Controllers / Route Handlers**:
  - Extract parameters from HTTP/gRPC requests (`req.body`, `req.params`).
  - Validate schema structure (e.g., using `zod`, `valibot`, `class-validator`).
  - Invoke the appropriate Use Case.
  - Catch application/domain errors and map them to appropriate HTTP status codes (400, 404, 409, 500).
- **Presenters / View Models**:
  - Transform output DTOs into specific response formats (e.g., formatting dates, masking sensitive fields, HATEOAS links).

### Outbound Adapters (Driven)
- **Repositories (Implementations)**:
  - Implement the interface defined in `application/ports/repositories/`.
  - Use ORM / Query Builder (`PrismaClient`, `TypeORM`, `Kysely`, `Mongoose`) to query and persist data.
- **Mappers**:
  - **To Domain**: Converts raw DB row/document into a valid Domain Entity.
  - **To Persistence**: Converts Domain Entity into database record/document format.
- **Gateways**:
  - Implement external service ports (e.g., `StripePaymentGateway` implementing `IPaymentGateway`).

---

## 4. Frameworks & Drivers Layer

The outermost layer consisting of tools, databases, frameworks, and web servers.

### Components
- HTTP Server configuration (Express, Fastify, NestJS bootstrap).
- Database connection pools, migrations, and ORM schema files (`schema.prisma`, migration scripts).
- Third-party SDK initializations (AWS SDK, Redis client, Stripe client).
- Composition Root (where dependency injection is configured).
