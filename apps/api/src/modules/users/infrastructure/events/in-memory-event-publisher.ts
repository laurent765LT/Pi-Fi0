import { Injectable, Logger } from '@nestjs/common';
import type { IUserEventPublisher } from '../../application/ports/event-publisher.port';
import type { UserDomainEvent } from '../../domain/events';

/**
 * Minimal event publisher — logs every domain event and returns.
 *
 * When we wire a real event bus (NestJS `EventEmitterModule`, BullMQ, or
 * an external broker) the adapter class changes here and NOTHING else:
 * the domain, application handlers, and tests stay untouched. This is
 * the whole point of the `IUserEventPublisher` port.
 */
@Injectable()
export class InMemoryUserEventPublisher implements IUserEventPublisher {
  private readonly logger = new Logger(InMemoryUserEventPublisher.name);

  async publish(events: readonly UserDomainEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.debug(
        `[users] ${event.name} @ ${event.occurredAt.toISOString()} — ${JSON.stringify(
          event,
        )}`,
      );
    }
  }
}
