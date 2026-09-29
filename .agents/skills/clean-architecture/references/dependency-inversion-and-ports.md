# Dependency Inversion & Ports in Node.js / TypeScript

The **Dependency Inversion Principle (DIP)** is the architectural backbone of Clean Architecture:
1. *High-level modules should not depend on low-level modules. Both should depend on abstractions.*
2. *Abstractions should not depend on details. Details should depend on abstractions.*

---

## 1. Port Ownership Rule

> **The Port (Interface) is defined and owned by the consumer (Application layer), NOT the producer (Infrastructure layer).**

```text
[ Application Layer ]
  ├── UseCase (Interacts with port)
  └── ports/
        └── IUserRepository.ts  <────────────┐
                                              │  (implements)
[ Infrastructure Layer ]                      │
  └── database/                               │
        └── PrismaUserRepository.ts ──────────┘
```

Notice the direction of dependency:
- `PrismaUserRepository` depends on `IUserRepository` (points inward).
- The Application layer does **not** depend on Prisma or the infrastructure folder.

---

## 2. Implementing Dependency Injection in TypeScript

Because TypeScript interfaces are erased at runtime, you cannot use an interface directly as a runtime injection token in reflection-based DI containers (like NestJS or TSyringe) without a token.

### Option A: NestJS (Custom Providers & Symbols/Tokens)

Define a constant symbol or string for the injection token:

```typescript
// src/modules/users/application/ports/user-repository.port.ts
export const USER_REPOSITORY_TOKEN = Symbol('USER_REPOSITORY_TOKEN');

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

Inject in the Use Case:

```typescript
// src/modules/users/application/use-cases/create-user.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../ports/user-repository.port';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: CreateUserInputDTO): Promise<CreateUserOutputDTO> {
    // business orchestration
  }
}
```

Bind in the NestJS Module:

```typescript
// src/modules/users/infrastructure/users.module.ts
import { Module } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../application/ports/user-repository.port';
import { PrismaUserRepository } from './database/prisma-user-repository';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { UserController } from './http/user.controller';

@Module({
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
  ],
})
export class UsersModule {}
```

---

### Option B: Plain TypeScript / Fastify / Express (Composition Root)

In lightweight setups without heavy reflection decorators:

```typescript
// src/composition-root.ts (or main.ts)
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from './modules/users/infrastructure/database/prisma-user.repository';
import { CreateUserUseCase } from './modules/users/application/use-cases/create-user.use-case';
import { UserController } from './modules/users/infrastructure/http/user.controller';

const prisma = new PrismaClient();

// Instantiate Adapters
const userRepository = new PrismaUserRepository(prisma);

// Instantiate Use Cases
const createUserUseCase = new CreateUserUseCase(userRepository);

// Instantiate Controllers
export const userController = new UserController(createUserUseCase);
```

---

## 3. In-Memory Test Doubles for Rapid Unit Testing

Because the Use Case depends exclusively on `IUserRepository`, you can write blazingly fast unit tests without starting a database or mocking complex ORM query builders:

```typescript
// test/fakes/in-memory-user-repository.ts
import { IUserRepository } from '../../src/modules/users/application/ports/user-repository.port';
import { User } from '../../src/modules/users/domain/entities/user.entity';

export class InMemoryUserRepository implements IUserRepository {
  public items: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.items.get(id) || null;
  }

  async save(user: User): Promise<void> {
    this.items.set(user.id, user);
  }
}
```

Unit test:

```typescript
// test/use-cases/create-user.use-case.spec.ts
describe('CreateUserUseCase', () => {
  it('should register a new active user', async () => {
    const fakeRepo = new InMemoryUserRepository();
    const useCase = new CreateUserUseCase(fakeRepo);

    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePassword123!',
    });

    expect(result.id).toBeDefined();
    expect(fakeRepo.items.size).toBe(1);
    expect(fakeRepo.items.get(result.id)?.name).toBe('John Doe');
  });
});
```
