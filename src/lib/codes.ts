import bcrypt from "bcryptjs";

const cache: Record<string, string> = {};

function getRequiredCode(hashedEnv: string, plainEnv: string): string {
  if (cache[hashedEnv]) return cache[hashedEnv];
  const hashed = process.env[hashedEnv];
  if (hashed && hashed.length > 0) {
    cache[hashedEnv] = hashed;
    return hashed;
  }
  const plain = process.env[plainEnv];
  if (plain && plain.length > 0) {
    cache[hashedEnv] = bcrypt.hashSync(plain, 10);
    return cache[hashedEnv];
  }
  throw new Error(
    `Access code is not configured. Set ${hashedEnv} (bcrypt hash) or ${plainEnv} (plain) in env.`,
  );
}

export function getUserCodeHash(): string {
  return getRequiredCode("USER_ACCESS_CODE_HASH", "USER_ACCESS_CODE");
}

export function getAdminCodeHash(): string {
  return getRequiredCode("ADMIN_ACCESS_CODE_HASH", "ADMIN_ACCESS_CODE");
}

export function verifyCode(plain: string, hash: string): boolean {
  if (!plain || plain.length === 0 || plain.length > 200) return false;
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}
