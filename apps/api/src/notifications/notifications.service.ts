import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface AppNotification {
  type: 'closing' | 'observation' | 'coupon' | 'autocall' | 'commitment' | 'system';
  title: string;
  message: string;
  productId?: string;
  productName?: string;
  timestamp: string;
}

@Injectable()
export class NotificationsService {
  private readonly subjects = new Map<string, Subject<AppNotification>>();

  getStream(userId: string): Observable<AppNotification> {
    if (!this.subjects.has(userId)) {
      this.subjects.set(userId, new Subject<AppNotification>());
    }
    return this.subjects.get(userId)!.asObservable();
  }

  emit(userId: string, notification: AppNotification) {
    this.subjects.get(userId)?.next(notification);
  }

  emitToAll(notification: AppNotification) {
    for (const subject of this.subjects.values()) {
      subject.next(notification);
    }
  }

  removeStream(userId: string) {
    this.subjects.get(userId)?.complete();
    this.subjects.delete(userId);
  }
}
