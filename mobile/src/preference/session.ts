import { Preferences } from "@capacitor/preferences";

let sessionExpirationDateCache: number | null = null;

const setSessionExpirationDate = async (expiresAt: number) => {
  sessionExpirationDateCache = expiresAt;

  await Preferences.set({
    key: 'session_expiration_date',
    value: expiresAt.toString()
  });
};

const getSessionExpirationDate = async (): Promise<number> => {
  const now = Date.now();

  if (sessionExpirationDateCache !== null) {
    return sessionExpirationDateCache;
  }
  
  const { value } = await Preferences.get({ key: 'session_expiration_date' });
  const expiration = Number(value);

  if (!value || isNaN(expiration)) {
    sessionExpirationDateCache = now;
  } else {
    sessionExpirationDateCache = expiration;
  }

  return sessionExpirationDateCache;
}

const isSessionExpired = async (): Promise<boolean> => {
  const now = Date.now();
  const expiration = await getSessionExpirationDate();
  return now >= expiration;
}

const expireSession = async () => {
  sessionExpirationDateCache = null;
  await Preferences.remove({ key: 'session_expiration_date' });
};

// Tout est stocke en claire (probleme de securite)
export { 
  setSessionExpirationDate, 
  getSessionExpirationDate, 
  isSessionExpired,
  expireSession
};
