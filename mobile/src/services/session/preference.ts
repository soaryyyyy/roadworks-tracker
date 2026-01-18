import { Preferences } from "@capacitor/preferences";

let expirationCache: number | null = null;

const setSessionExpirationDate = async (expiresAt: number) => {
  expirationCache = expiresAt;

  await Preferences.set({
    key: 'session_expiration_date',
    value: expiresAt.toString()
  });
};

const getSessionExpirationDate = async (): Promise<number> => {
  if (expirationCache !== null) {
    return expirationCache;
  }
  
  const { value } = await Preferences.get({ key: 'session_expiration_date' });
  const expiration = Number(value);

  if (!value || isNaN(expiration)) {
    expirationCache = Date.now();
  } else {
    expirationCache = expiration;
  }

  return expirationCache;
}

const isSessionExpired = async (): Promise<boolean> => {
  const expiration = await getSessionExpirationDate();
  return Date.now() >= expiration;
}

// Tout est stocke en claire il y a peut etre des problemes securite liees a cette facon de faire
export { setSessionExpirationDate, getSessionExpirationDate, isSessionExpired };
