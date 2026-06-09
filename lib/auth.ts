import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "nexa-ppc-super-secret-key-123456789";
const key = new TextEncoder().encode(JWT_SECRET);

export interface UserPayload {
  user_id: string;
  username: string;
  role_name: string;
  supplier_id: string | null;
  full_name: string;
}

export async function signJWT(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function verifyJWT(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as UserPayload;
  } catch (error) {
    return null;
  }
}
