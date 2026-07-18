const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const token = sessionStorage.getItem('token');
  const activeBranch = JSON.parse(sessionStorage.getItem('activeBranch') || 'null');
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (activeBranch?.id) {
    headers['X-Branch-Id'] = String(activeBranch.id);
  }

  return headers;
};

export const apiFetch = async (path, options = {}) => {
  const headers = {
    ...authHeaders(),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    // Keep data as empty object if parsing JSON fails (e.g. 204 No Content)
  }

  if (!res.ok) {
    if (res.status === 401) {
      sessionStorage.clear();
      window.location.href = '/login';
    }
    throw new Error(data.message || 'Request failed');
  }
  return data;
};
