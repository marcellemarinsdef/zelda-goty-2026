# Creational Design Patterns in TypeScript

Creational patterns abstract the instantiation process, making systems independent of how their objects are created, composed, and represented.

---

## 1. Factory Method & Abstract Factory

### The Problem
Using direct `new ConcreteClass()` spreads tight coupling across your codebase, making it difficult to swap implementations or support multiple environments/variants.

### Factory Method (Idiomatic TypeScript)
In TypeScript, factory methods can be implemented via classes or factory functions:

```typescript
// Interface for notification providers
export interface INotificationService {
  send(recipient: string, message: string): Promise<void>;
}

export class EmailNotificationService implements INotificationService {
  async send(recipient: string, message: string): Promise<void> {
    console.log(`Sending Email to ${recipient}: ${message}`);
  }
}

export class SMSNotificationService implements INotificationService {
  async send(recipient: string, message: string): Promise<void> {
    console.log(`Sending SMS to ${recipient}: ${message}`);
  }
}

export class PushNotificationService implements INotificationService {
  async send(recipient: string, message: string): Promise<void> {
    console.log(`Sending Push Notification to ${recipient}: ${message}`);
  }
}

// Factory
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

export class NotificationFactory {
  public static create(channel: NotificationChannel): INotificationService {
    switch (channel) {
      case 'EMAIL':
        return new EmailNotificationService();
      case 'SMS':
        return new SMSNotificationService();
      case 'PUSH':
        return new PushNotificationService();
      default:
        const _exhaustiveCheck: never = channel;
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }
}
```

---

## 2. Builder Pattern

### The Problem
When an object has many optional parameters or complex validation, constructor parameters become unwieldy (the "telescoping constructor" anti-pattern).

### Builder Implementation
The Builder pattern provides a fluent, step-by-step API to construct objects cleanly:

```typescript
export interface UserPreferences {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  locale: string;
}

export class UserProfile {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public readonly bio?: string,
    public readonly avatarUrl?: string,
    public readonly preferences?: UserPreferences
  ) {}
}

export class UserProfileBuilder {
  private id = crypto.randomUUID();
  private username = '';
  private email = '';
  private bio?: string;
  private avatarUrl?: string;
  private preferences: UserPreferences = {
    theme: 'dark',
    notificationsEnabled: true,
    locale: 'en-US',
  };

  public setUsername(username: string): this {
    if (username.length < 3) throw new Error('Username must be at least 3 characters');
    this.username = username;
    return this;
  }

  public setEmail(email: string): this {
    if (!email.includes('@')) throw new Error('Invalid email');
    this.email = email;
    return this;
  }

  public setBio(bio: string): this {
    this.bio = bio;
    return this;
  }

  public setAvatarUrl(avatarUrl: string): this {
    this.avatarUrl = avatarUrl;
    return this;
  }

  public withTheme(theme: 'light' | 'dark'): this {
    this.preferences.theme = theme;
    return this;
  }

  public build(): UserProfile {
    if (!this.username) throw new Error('Username is required');
    if (!this.email) throw new Error('Email is required');

    return new UserProfile(
      this.id,
      this.username,
      this.email,
      this.bio,
      this.avatarUrl,
      this.preferences
    );
  }
}

// Usage
const profile = new UserProfileBuilder()
  .setUsername('marcelle')
  .setEmail('marcelle@example.com')
  .withTheme('dark')
  .build();
```

---

## 3. Singleton Pattern (and Node.js Caveats)

### The Classical Singleton
Ensures a class has only one instance and provides a global access point.

```typescript
export class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool | null = null;

  private constructor() {
    // initialize connection pool
  }

  public static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }
}
```

### Best Practice in Modern Node.js:
> ⚠️ **Warning**: Classical Singletons introduce hidden global state and make unit testing difficult (mocking is hard, state leaks across test suites).
>
> **Preferred Alternative**: Use **Dependency Injection Singletons** (scoped by your DI container such as NestJS `@Injectable({ scope: Scope.DEFAULT })` or Awilix `asClass().singleton()`), or rely on **Node.js module caching** (`export const pool = new ConnectionPool()`).
