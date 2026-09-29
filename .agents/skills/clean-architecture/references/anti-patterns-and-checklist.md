# Anti-Patterns & Architecture Review Checklist

Avoid these common pitfalls when applying Clean Architecture to TypeScript/Node.js projects.

---

## 1. Top Clean Architecture Anti-Patterns

### Anti-Pattern 1: The Anemic Domain Model
- **Symptom**: Entities only have public properties or getters/setters, with zero business logic methods. All rules are written in Use Cases or "Services".
- **Problem**: Breaks encapsulation and object-oriented principles. Invariants can be violated from anywhere.
- **Solution**: Protect state. Make constructors private, use factory methods (`Entity.create()`), and encapsulate behavior inside domain methods (`order.cancel()`, `user.changePassword()`).

### Anti-Pattern 2: Mixing ORM Models with Domain Entities
- **Symptom**: Decorating domain classes with `@Entity()`, `@Column()` (TypeORM), or using generated `@prisma/client` models as domain entities.
- **Problem**: Ties business rules to the database schema. If the DB schema changes (e.g., column renaming, normalization), domain rules break.
- **Solution**: Keep Domain Entities pure TypeScript. Create separate DB models or schemas in `infrastructure/database/` and write explicit Mappers.

### Anti-Pattern 3: Passing HTTP Objects to the Application Layer
- **Symptom**: Use cases accepting `Request`, `Response`, or `@Param()` directly.
- **Problem**: Makes Use Cases impossible to test or reuse via CLI, cron jobs, or message queues (RabbitMQ, Kafka).
- **Solution**: Controllers extract plain primitives / DTOs from `req.body` / `req.params` and pass standard TypeScript DTOs to the Use Case.

### Anti-Pattern 4: Leaking Domain Entities into HTTP Responses
- **Symptom**: Returning Domain Entity instances directly in the HTTP JSON response (`res.json(user)`).
- **Problem**: Exposes internal domain structure, potentially leaking sensitive properties (e.g., `passwordHash`, internal flags) and breaking contract versioning.
- **Solution**: Map the Domain Entity to a tailored `OutputDTO` or ViewModel in the Presenter/Controller.

### Anti-Pattern 5: Premature Over-Abstraction for Trivial CRUD
- **Symptom**: Creating 15 files and 4 layers for a simple static lookup table (e.g. list of country codes).
- **Rule of Thumb**: Apply Clean Architecture to core business domains and complex workflows. For pure, unchanging pass-through reads, use pragmatic query handlers.

---

## 2. Review Checklist

Use this checklist during code reviews or before concluding architectural refactoring:

### Domain Layer Checklist
- [ ] Is `domain/` completely free of `@nestjs/*`, `express`, `fastify`, `@prisma/*`, and `typeorm` imports?
- [ ] Are business invariants enforced inside Entities and Value Objects?
- [ ] Are Value Objects immutable (e.g. `readonly` properties, returning new instances on change)?
- [ ] Are errors domain-specific (e.g., `InsufficientBalanceError`) rather than generic `HttpException(400)`?

### Application Layer Checklist
- [ ] Does each Use Case have a single, well-defined responsibility?
- [ ] Are external dependencies represented as interfaces in `application/ports/`?
- [ ] Are input parameters received as plain DTOs rather than framework request objects?
- [ ] Are output results returned as DTOs or `Result<Value, Error>` objects?
- [ ] Can the use case be unit-tested using simple in-memory repository fakes without any mocking libraries?

### Infrastructure / Adapters Checklist
- [ ] Do repository implementations in `infrastructure/` implement the exact interfaces defined in `application/ports/`?
- [ ] Are bidirectional Mappers (`toDomain` / `toPersistence`) tested and handling nulls/dates properly?
- [ ] Do Controllers catch Domain/Application errors and map them to standard HTTP status codes?
- [ ] Is third-party configuration (connection strings, API keys) strictly confined to the infrastructure layer?
