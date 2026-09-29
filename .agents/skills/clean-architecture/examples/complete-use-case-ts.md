# Complete TypeScript Implementation Example: User Registration

This example demonstrates an end-to-end Clean Architecture feature implementing User Registration in TypeScript.

---

## 1. Domain Layer

### Value Object: `Email`
```typescript
// src/modules/users/domain/value-objects/email.vo.ts
export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email.toLowerCase().trim();
  }

  public static create(email: string): Email {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }
    return new Email(email);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.getValue();
  }
}
```

### Entity: `User`
```typescript
// src/modules/users/domain/entities/user.entity.ts
import { Email } from '../value-objects/email.vo';

export interface UserProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
}

export class User {
  private readonly props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
  }

  // Factory method for creating a brand new user
  public static createNew(name: string, email: Email, passwordHash: string): User {
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    return new User({
      id: crypto.randomUUID(),
      name: name.trim(),
      email,
      passwordHash,
      isActive: true,
      createdAt: new Date(),
    });
  }

  // Factory method for reconstituting an existing user from persistence
  public static restore(props: UserProps): User {
    return new User(props);
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get email(): Email { return this.props.email; }
  public get passwordHash(): string { return this.props.passwordHash; }
  public get isActive(): boolean { return this.props.isActive; }
  public get createdAt(): Date { return this.props.createdAt; }

  public deactivate(): void {
    this.props.isActive = false;
  }
}
```

---

## 2. Application Layer

### DTOs
```typescript
// src/modules/users/application/dtos/create-user.dto.ts
export interface CreateUserInputDTO {
  name: string;
  email: string;
  plainPassword: string;
}

export interface CreateUserOutputDTO {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
```

### Ports (Interfaces)
```typescript
// src/modules/users/application/ports/user-repository.port.ts
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

```typescript
// src/modules/users/application/ports/password-hasher.port.ts
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
```

### Use Case (Interactor)
```typescript
// src/modules/users/application/use-cases/create-user.use-case.ts
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { CreateUserInputDTO, CreateUserOutputDTO } from '../dtos/create-user.dto';
import { IUserRepository } from '../ports/user-repository.port';
import { IPasswordHasher } from '../ports/password-hasher.port';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  public async execute(input: CreateUserInputDTO): Promise<CreateUserOutputDTO> {
    const emailVO = Email.create(input.email);

    // 1. Enforce business rule: unique email
    const existing = await this.userRepository.findByEmail(emailVO);
    if (existing) {
      throw new Error('Email is already registered');
    }

    // 2. Hash password via driven port
    const passwordHash = await this.passwordHasher.hash(input.plainPassword);

    // 3. Instantiate domain entity
    const user = User.createNew(input.name, emailVO, passwordHash);

    // 4. Persist
    await this.userRepository.save(user);

    // 5. Return Output DTO (no domain entity leakage)
    return {
      id: user.id,
      name: user.name,
      email: user.email.getValue(),
      createdAt: user.createdAt.toISOString(),
    };
  }
}
```

---

## 3. Infrastructure Layer (Adapters)

### Persistence Mapper
```typescript
// src/modules/users/infrastructure/database/mappers/user.mapper.ts
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';

export interface PrismaUserModel {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
}

export class UserMapper {
  public static toDomain(raw: PrismaUserModel): User {
    return User.restore({
      id: raw.id,
      name: raw.name,
      email: Email.create(raw.email),
      passwordHash: raw.password_hash,
      isActive: raw.is_active,
      createdAt: raw.created_at,
    });
  }

  public static toPersistence(user: User): PrismaUserModel {
    return {
      id: user.id,
      name: user.name,
      email: user.email.getValue(),
      password_hash: user.passwordHash,
      is_active: user.isActive,
      created_at: user.createdAt,
    };
  }
}
```

### Prisma Repository Implementation
```typescript
// src/modules/users/infrastructure/database/repositories/prisma-user.repository.ts
import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../../application/ports/user-repository.port';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserMapper } from '../mappers/user.mapper';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: Email): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
    });

    if (!raw) return null;
    return UserMapper.toDomain(raw);
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    });
  }
}
```

### Fastify / Express Controller
```typescript
// src/modules/users/infrastructure/http/controllers/create-user.controller.ts
import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';

export class CreateUserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password } = req.body;

      const result = await this.createUserUseCase.execute({
        name,
        email,
        plainPassword: password,
      });

      return res.status(201).json(result);
    } catch (error: any) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('Invalid email') || error.message.includes('characters long')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```
