export type AuthMode = 'login' | 'signup';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
}

interface StoredUser extends AuthUser {
  passwordHash: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
  displayName?: string;
}

const USERS_STORAGE_KEY = 'onelive_auth_users';
const SESSION_STORAGE_KEY = 'onelive_auth_session';

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readUsers = (): StoredUser[] => readJson<StoredUser[]>(USERS_STORAGE_KEY, []);

const writeUsers = (users: StoredUser[]) => writeJson(USERS_STORAGE_KEY, users);

const toSessionUser = (user: StoredUser): AuthUser => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  createdAt: user.createdAt,
});

const hashPassword = async (password: string) => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return password;
  }

  const encoded = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const createDisplayName = (email: string) => {
  const name = email.split('@')[0] ?? 'Guest';
  return name
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || 'Guest User';
};

const createAuthError = (message: string) => new Error(message);

export const loadAuthSession = (): AuthSession | null => readJson<AuthSession | null>(SESSION_STORAGE_KEY, null);

export const saveAuthSession = (session: AuthSession | null) => {
  if (session) {
    writeJson(SESSION_STORAGE_KEY, session);
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const clearAuthSession = () => saveAuthSession(null);

export const signup = async ({ email, password, displayName }: AuthCredentials): Promise<AuthSession> => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();

  if (!normalizedEmail) {
    throw createAuthError('Email is required.');
  }

  if (!normalizedPassword) {
    throw createAuthError('Password is required.');
  }

  const users = readUsers();
  if (users.some((user) => normalizeEmail(user.email) === normalizedEmail)) {
    throw createAuthError('This email is already registered.');
  }

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    displayName: displayName?.trim() || createDisplayName(normalizedEmail),
    passwordHash: await hashPassword(normalizedPassword),
    createdAt: new Date().toISOString(),
  };

  writeUsers([newUser, ...users]);

  const session = { user: toSessionUser(newUser) };
  saveAuthSession(session);
  return session;
};

export const login = async ({ email, password }: AuthCredentials): Promise<AuthSession> => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();

  if (!normalizedEmail) {
    throw createAuthError('Email is required.');
  }

  if (!normalizedPassword) {
    throw createAuthError('Password is required.');
  }

  const users = readUsers();
  const user = users.find((entry) => normalizeEmail(entry.email) === normalizedEmail);

  if (!user) {
    throw createAuthError('No account found for this email.');
  }

  const passwordHash = await hashPassword(normalizedPassword);
  if (user.passwordHash !== passwordHash) {
    throw createAuthError('Invalid password.');
  }

  const session = { user: toSessionUser(user) };
  saveAuthSession(session);
  return session;
};

export const signOut = () => {
  clearAuthSession();
};