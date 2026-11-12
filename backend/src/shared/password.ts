import { hash, verify } from "@node-rs/argon2";

// argon2id with the library defaults (the library's default algorithm is argon2id).
export const hashPassword = (password: string): Promise<string> => hash(password);

// Never throws on a malformed stored hash: a corrupt credential simply fails to verify.
export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}
