# Modern TypeScript Design Patterns Synergy Example

This example demonstrates how **Strategy**, **Builder**, **Adapter**, and **Decorator** work harmoniously together in a production-ready Payment Processing system.

---

## 1. Domain Entities & Value Objects

```typescript
export interface PaymentResult {
  transactionId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  timestamp: Date;
}

export interface PaymentDetails {
  orderId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}
```

---

## 2. Builder Pattern: Fluent Payment Request Builder

Eliminates invalid or incomplete payment configurations before processing.

```typescript
export class PaymentDetailsBuilder {
  private orderId = '';
  private amount = 0;
  private currency = 'BRL';
  private metadata: Record<string, string> = {};

  public forOrder(orderId: string): this {
    if (!orderId) throw new Error('Order ID is required');
    this.orderId = orderId;
    return this;
  }

  public withAmount(amount: number): this {
    if (amount <= 0) throw new Error('Payment amount must be greater than zero');
    this.amount = amount;
    return this;
  }

  public inCurrency(currency: string): this {
    this.currency = currency.toUpperCase();
    return this;
  }

  public withTag(key: string, value: string): this {
    this.metadata[key] = value;
    return this;
  }

  public build(): PaymentDetails {
    if (!this.orderId) throw new Error('Cannot build payment without orderId');
    if (this.amount <= 0) throw new Error('Cannot build payment without valid amount');

    return {
      orderId: this.orderId,
      amount: this.amount,
      currency: this.currency,
      metadata: { ...this.metadata },
    };
  }
}
```

---

## 3. Strategy Pattern: Interchangeable Payment Methods

```typescript
export interface IPaymentStrategy {
  readonly method: 'PIX' | 'CREDIT_CARD';
  process(details: PaymentDetails): Promise<PaymentResult>;
}

// Strategy A: Pix
export class PixPaymentStrategy implements IPaymentStrategy {
  public readonly method = 'PIX' as const;

  async process(details: PaymentDetails): Promise<PaymentResult> {
    console.log(`Generating Pix QR Code for Order ${details.orderId} (R$ ${details.amount})`);
    return {
      transactionId: `pix_${crypto.randomUUID()}`,
      amount: details.amount,
      status: 'SUCCESS',
      timestamp: new Date(),
    };
  }
}

// Strategy B: Credit Card
export class CreditCardPaymentStrategy implements IPaymentStrategy {
  public readonly method = 'CREDIT_CARD' as const;

  constructor(private readonly cardToken: string, private readonly installments = 1) {}

  async process(details: PaymentDetails): Promise<PaymentResult> {
    console.log(`Charging Card Token ${this.cardToken} in ${this.installments}x for R$ ${details.amount}`);
    return {
      transactionId: `cc_${crypto.randomUUID()}`,
      amount: details.amount,
      status: 'SUCCESS',
      timestamp: new Date(),
    };
  }
}
```

---

## 4. Decorator Pattern: Adding Resilience (Retry & Logging)

Decorators wrap any `IPaymentStrategy` without modifying its underlying code.

```typescript
// Decorator: Logs and audits transaction execution
export class AuditLoggingPaymentDecorator implements IPaymentStrategy {
  constructor(private readonly innerStrategy: IPaymentStrategy) {}

  public get method() {
    return this.innerStrategy.method;
  }

  async process(details: PaymentDetails): Promise<PaymentResult> {
    console.log(`[AUDIT START] Processing ${this.method} for Order: ${details.orderId}`);
    const start = performance.now();

    try {
      const result = await this.innerStrategy.process(details);
      console.log(`[AUDIT SUCCESS] Transaction: ${result.transactionId} took ${(performance.now() - start).toFixed(2)}ms`);
      return result;
    } catch (error: any) {
      console.error(`[AUDIT FAILURE] Order ${details.orderId} failed: ${error.message}`);
      throw error;
    }
  }
}

// Decorator: Automatic Retry on Transient Failures
export class RetryPaymentDecorator implements IPaymentStrategy {
  constructor(
    private readonly innerStrategy: IPaymentStrategy,
    private readonly maxRetries = 2
  ) {}

  public get method() {
    return this.innerStrategy.method;
  }

  async process(details: PaymentDetails): Promise<PaymentResult> {
    let attempts = 0;
    while (true) {
      try {
        attempts++;
        return await this.innerStrategy.process(details);
      } catch (error) {
        if (attempts > this.maxRetries) {
          throw error;
        }
        console.warn(`[RETRY] Attempt ${attempts} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 200 * attempts));
      }
    }
  }
}
```

---

## 5. Composition and Usage

Observe how seamlessly the patterns fit together:

```typescript
// 1. Build payment parameters safely using Builder
const paymentDetails = new PaymentDetailsBuilder()
  .forOrder('order_abc123')
  .withAmount(250.75)
  .inCurrency('BRL')
  .withTag('customerType', 'VIP')
  .build();

// 2. Select strategy (e.g. Pix)
const baseStrategy = new PixPaymentStrategy();

// 3. Decorate strategy with Retry and Auditing
const resilientProcessor = new AuditLoggingPaymentDecorator(
  new RetryPaymentDecorator(baseStrategy, 3)
);

// 4. Execute cleanly
async function main() {
  const result = await resilientProcessor.process(paymentDetails);
  console.log(`Payment confirmed: ${result.transactionId} (Status: ${result.status})`);
}

main();
```
