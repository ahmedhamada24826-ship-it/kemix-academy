/**
 * Password Hashing Abstraction (IPasswordHasher)
 */
export interface IPasswordHasher {
  /**
   * Hashes a plain-text password using a secure algorithm (Argon2id)
   */
  hash(plainText: string): Promise<string>;

  /**
   * Verifies a plain-text password against a stored PHC hash string
   */
  verify(hash: string, plainText: string): Promise<boolean>;
}
