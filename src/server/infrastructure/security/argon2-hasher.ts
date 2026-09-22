import { hash, verify } from "@node-rs/argon2";
import { IPasswordHasher } from "@/server/domain/security/hasher.interface";

/**
 * Argon2id Implementation of IPasswordHasher
 *
 * Implements OWASP recommended parameters for password hashing (RFC 9106):
 * - Memory cost: 64MB (65536 KiB)
 * - Iterations: 3
 * - Parallelism: 4
 */
export class Argon2Hasher implements IPasswordHasher {
  async hash(plainText: string): Promise<string> {
    return await hash(plainText, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verify(storedHash: string, plainText: string): Promise<boolean> {
    try {
      return await verify(storedHash, plainText);
    } catch {
      return false;
    }
  }
}

export const passwordHasher = new Argon2Hasher();
