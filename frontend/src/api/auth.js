import { apiFetch } from './client';

export const loginUser = async (email, password) => {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};
