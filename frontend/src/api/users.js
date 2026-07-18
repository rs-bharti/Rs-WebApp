import { apiFetch } from './client';

export const getUsers = () => apiFetch('/api/users');

export const createUser = (userData) =>
  apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const getBranches = () => 
  apiFetch('/api/users/branches'); // full list — use filterBranches() from AuthContext to restrict by user permissions

export const getRoles = () => apiFetch('/api/users/roles');

export const deleteUser = (userId) =>
  apiFetch(`/api/users/${userId}`, {
    method: 'DELETE',
  });

export const forceDeleteUser = (userId) =>
  apiFetch(`/api/users/${userId}/force`, {
    method: 'DELETE',
  });

export const toggleUserActive = (userId) =>
  apiFetch(`/api/users/${userId}/toggle-active`, {
    method: 'PATCH',
  });

export const updateUserPermissions = (userId, permissions, password, email, name) => {
  const body = {};
  if (permissions !== undefined) body.permissions = permissions;
  if (password) body.password = password;
  if (email)    body.email    = email;
  if (name)     body.name     = name;
  return apiFetch(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};
