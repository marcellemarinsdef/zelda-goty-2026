# Behavioral Design Patterns in TypeScript

Behavioral design patterns identify common communication patterns between objects and realize these patterns. By doing so, these patterns increase flexibility in carrying out this communication.

---

## 1. Strategy Pattern

### The Problem
You have multiple variants of an algorithm or business rule (e.g., shipping rate calculation, tax rates, payment processors). Hardcoding them with `if/else` or `switch` statements violates the Open/Closed Principle (OCP).

### Solution
Define a family of algorithms behind a common interface and inject them at runtime:

```typescript
export interface ShippingStrategy {
  calculateCost(weightInKg: number, distanceInKm: number): number;
}

export class StandardShippingStrategy implements ShippingStrategy {
  calculateCost(weightInKg: number, distanceInKm: number): number {
    return 5 + weightInKg * 1.5 + distanceInKm * 0.05;
  }
}

export class ExpressShippingStrategy implements ShippingStrategy {
  calculateCost(weightInKg: number, distanceInKm: number): number {
    return 15 + weightInKg * 3.0 + distanceInKm * 0.1;
  }
}

export class FreeOverAmountShippingStrategy implements ShippingStrategy {
  calculateCost(weightInKg: number, distanceInKm: number): number {
    return 0; // free shipping
  }
}

// Context
export class ShippingCostCalculator {
  constructor(private strategy: ShippingStrategy) {}

  public setStrategy(strategy: ShippingStrategy): void {
    this.strategy = strategy;
  }

  public calculate(weight: number, distance: number): number {
    return this.strategy.calculateCost(weight, distance);
  }
}
```

---

## 2. Chain of Responsibility Pattern

### The Problem
A request needs to pass through a series of checks or processing stages (e.g., authentication $\rightarrow$ rate limiting $\rightarrow$ role validation $\rightarrow$ payload sanitization), where any stage can reject the request or pass it to the next.

### Solution
Each handler holds a reference to the next handler:

```typescript
export interface IHttpRequest {
  ip: string;
  token?: string;
  role?: string;
}

export abstract class RequestHandler {
  private nextHandler: RequestHandler | null = null;

  public setNext(handler: RequestHandler): RequestHandler {
    this.nextHandler = handler;
    return handler; // allows chaining: h1.setNext(h2).setNext(h3)
  }

  public async handle(req: IHttpRequest): Promise<boolean> {
    if (this.nextHandler) {
      return this.nextHandler.handle(req);
    }
    return true; // end of chain reached successfully
  }
}

export class RateLimiterHandler extends RequestHandler {
  private requestCounts = new Map<string, number>();

  public override async handle(req: IHttpRequest): Promise<boolean> {
    const count = (this.requestCounts.get(req.ip) || 0) + 1;
    this.requestCounts.set(req.ip, count);

    if (count > 100) {
      throw new Error(`Rate limit exceeded for IP: ${req.ip}`);
    }

    return super.handle(req);
  }
}

export class AuthenticationHandler extends RequestHandler {
  public override async handle(req: IHttpRequest): Promise<boolean> {
    if (!req.token || req.token !== 'valid-bearer-token') {
      throw new Error('Unauthorized: Invalid or missing token');
    }

    return super.handle(req);
  }
}

export class RoleAuthorizationHandler extends RequestHandler {
  constructor(private readonly requiredRole: string) {
    super();
  }

  public override async handle(req: IHttpRequest): Promise<boolean> {
    if (req.role !== this.requiredRole) {
      throw new Error(`Forbidden: Requires role ${this.requiredRole}`);
    }

    return super.handle(req);
  }
}

// Composition:
const rateLimiter = new RateLimiterHandler();
const auth = new AuthenticationHandler();
const adminAuth = new RoleAuthorizationHandler('ADMIN');

rateLimiter.setNext(auth).setNext(adminAuth);

// Usage:
// await rateLimiter.handle({ ip: '127.0.0.1', token: 'valid-bearer-token', role: 'ADMIN' });
```

---

## 3. Observer Pattern (Pub-Sub)

### The Problem
Multiple components need to react when an event happens without having direct dependencies on each other.

### Solution: Typed EventEmitter / Event Bus

```typescript
export type EventHandler<T> = (data: T) => void | Promise<void>;

export class EventBus<Events extends Record<string, any>> {
  private listeners = new Map<keyof Events, Set<EventHandler<any>>>();

  public subscribe<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    // Unsubscribe callback
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  public async publish<K extends keyof Events>(event: K, data: Events[K]): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      await handler(data);
    }
  }
}

// Strongly-typed event contracts:
interface AppEvents {
  'user:registered': { userId: string; email: string };
  'order:placed': { orderId: string; amount: number };
}

const bus = new EventBus<AppEvents>();

// Subscriber 1: Send Welcome Email
bus.subscribe('user:registered', async ({ email }) => {
  console.log(`Sending welcome email to ${email}`);
});

// Subscriber 2: Analytics tracking
bus.subscribe('user:registered', async ({ userId }) => {
  console.log(`Tracking analytics for new user ${userId}`);
});

// Publisher:
await bus.publish('user:registered', { userId: '123', email: 'test@example.com' });
```
