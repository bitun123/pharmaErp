import { AuthMembership, AuthSession } from "@repo/contracts/types/auth.types";


interface AuthSessionUserInput {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
}

interface AuthSessionDetailsInput {
  id: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface CreateAuthSessionInput {
  user: AuthSessionUserInput;
  session: AuthSessionDetailsInput;
  membership?: AuthMembership | null;
}

const toISOString = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString() : value;
};

export const createAuthSessionResponse = ({
  user,
  session,
  membership = null,
}: CreateAuthSessionInput): AuthSession => {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? null,
      // The role always comes from the membership.
      role: membership?.role ?? undefined,
    },

    session: {
      id: session.id,
      expiresAt: toISOString(session.expiresAt),
      createdAt: toISOString(session.createdAt),
      updatedAt: toISOString(session.updatedAt),
    },

    membership,
  };
};
