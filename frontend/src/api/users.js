const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const getUsers = async () => {
  const res = await fetch(`${API_URL}/api/users`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
  return data;
};

export const getUser = async (id) => {
  const res = await fetch(`${API_URL}/api/users/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch user');
  return data;
};

export const createUser = async (userData) => {
  const res = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create user');
  return data;
};

export const updateUser = async (id, userData) => {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update user');
  return data;
};

export const deleteUser = async (id) => {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete user');
  return data;
};

export const getBranches = async () => {
  const res = await fetch(`${API_URL}/api/users/branches`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch branches');
  return data; // full list — use filterBranches() from AuthContext to restrict by user permissions
};

export const getRoles = async () => {
  const res = await fetch(`${API_URL}/api/users/roles`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch roles');
  return data;
};
