import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { IPasswordHasher } from '../../application/ports/password-hasher.port';

/**
 * Argon2id implementation of `IPasswordHasher`. Parameters match the
 * production auth service so tokens issued by the users module and the
 * auth module remain interchangeable.
 */
@Injectable()
export class Argon2PasswordHasher implements IPasswordHasher {
  private readonly options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  } as const;

  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
