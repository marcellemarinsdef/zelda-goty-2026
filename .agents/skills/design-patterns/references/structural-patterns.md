# Structural Design Patterns in TypeScript

Structural patterns explain how to assemble objects and classes into larger structures while keeping these structures flexible and efficient.

---

## 1. Adapter Pattern

### The Problem
You have an existing class or third-party library whose interface is incompatible with the rest of your application's architecture (e.g., your Use Cases expect a standard Port interface).

### Solution: Object Adapter
The Adapter wraps the incompatible object and translates calls:

```typescript
// Target Interface (Port expected by our application)
export interface IEmailSender {
  sendEmail(to: string, subject: string, bodyHtml: string): Promise<void>;
}

// Incompatible Third-Party SDK (Adaptee)
export class SendGridThirdPartySDK {
  public async deliverMail(payload: {
    recipient_email: string;
    mail_subject: string;
    content: { type: string; value: string }[];
  }): Promise<{ status_code: number }> {
    // raw sendgrid API call
    return { status_code: 202 };
  }
}

// Adapter implementing Target Interface
export class SendGridEmailAdapter implements IEmailSender {
  constructor(private readonly sendgrid: SendGridThirdPartySDK) {}

  async sendEmail(to: string, subject: string, bodyHtml: string): Promise<void> {
    const response = await this.sendgrid.deliverMail({
      recipient_email: to,
      mail_subject: subject,
      content: [{ type: 'text/html', value: bodyHtml }],
    });

    if (response.status_code >= 400) {
      throw new Error(`SendGrid delivery failed with status ${response.status_code}`);
    }
  }
}
```

---

## 2. Decorator Pattern

### The Problem
You want to add cross-cutting concerns (e.g., caching, logging, retry logic, metrics) to an object dynamically without altering its original code or creating endless inheritance subclasses.

### Solution: Composable Wrapping Decorator

```typescript
export interface IProductService {
  getProductById(id: string): Promise<{ id: string; name: string; price: number }>;
}

// Concrete Component
export class ProductService implements IProductService {
  async getProductById(id: string) {
    // Simulating database latency
    await new Promise((r) => setTimeout(r, 100));
    return { id, name: 'Mechanical Keyboard', price: 120 };
  }
}

// Decorator: Adds In-Memory Caching
export class CachedProductServiceDecorator implements IProductService {
  private cache = new Map<string, { id: string; name: string; price: number }>();

  constructor(private readonly innerService: IProductService) {}

  async getProductById(id: string) {
    if (this.cache.has(id)) {
      console.log(`[Cache HIT] for product ${id}`);
      return this.cache.get(id)!;
    }

    console.log(`[Cache MISS] fetching product ${id}`);
    const product = await this.innerService.getProductById(id);
    this.cache.set(id, product);
    return product;
  }
}

// Decorator: Adds Execution Timing
export class TimedProductServiceDecorator implements IProductService {
  constructor(private readonly innerService: IProductService) {}

  async getProductById(id: string) {
    const start = performance.now();
    try {
      return await this.innerService.getProductById(id);
    } finally {
      const elapsed = (performance.now() - start).toFixed(2);
      console.log(`[Metrics] getProductById took ${elapsed}ms`);
    }
  }
}

// Usage: Stack decorators cleanly!
const baseService = new ProductService();
const cachedService = new CachedProductServiceDecorator(baseService);
const timedAndCachedService = new TimedProductServiceDecorator(cachedService);

// Calls will now be both timed and cached without touching ProductService!
```

---

## 3. Facade Pattern

### The Problem
Interacting with a complex subsystem requires coordinating dozens of classes, configurations, and low-level methods.

### Solution
Provide a single unified class that offers a high-level, simplified interface:

```typescript
// Subsystems
class VideoDecoder { decode(file: string) { return 'raw-video-stream'; } }
class AudioMixer { mix(audio: string) { return 'master-audio'; } }
class Compressor { compress(stream: string, codec: string) { return 'compressed-file.mp4'; } }

// Facade
export class VideoConverterFacade {
  private decoder = new VideoDecoder();
  private mixer = new AudioMixer();
  private compressor = new Compressor();

  public convertVideo(filename: string, codec: 'h264' | 'h265'): string {
    const rawVideo = this.decoder.decode(filename);
    const audio = this.mixer.mix('track1');
    return this.compressor.compress(`${rawVideo}+${audio}`, codec);
  }
}

// Client only needs one call:
const converter = new VideoConverterFacade();
converter.convertVideo('vacation.mov', 'h264');
```
