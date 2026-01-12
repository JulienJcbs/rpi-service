import type { Device, Group, Trigger, Action, EventLog, PaginatedResponse } from './types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Devices
export const devicesApi = {
  getAll: () => fetchApi<Device[]>('/devices'),
  getById: (id: string) => fetchApi<Device>(`/devices/${id}`),
  create: (data: Partial<Device>) => fetchApi<Device>('/devices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Device>) => fetchApi<Device>(`/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchApi<void>(`/devices/${id}`, { method: 'DELETE' }),
};

// Groups
export const groupsApi = {
  getAll: () => fetchApi<Group[]>('/groups'),
  getById: (id: string) => fetchApi<Group>(`/groups/${id}`),
  create: (data: Partial<Group>) => fetchApi<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Group>) => fetchApi<Group>(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchApi<void>(`/groups/${id}`, { method: 'DELETE' }),
};

// Triggers
export const triggersApi = {
  getAll: () => fetchApi<Trigger[]>('/triggers'),
  getByDevice: (deviceId: string) => fetchApi<Trigger[]>(`/triggers/device/${deviceId}`),
  getById: (id: string) => fetchApi<Trigger>(`/triggers/${id}`),
  create: (data: { name: string; type: string; config: Record<string, unknown>; deviceId: string; description?: string }) => 
    fetchApi<Trigger>('/triggers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Trigger> & { config?: Record<string, unknown> }) => 
    fetchApi<Trigger>(`/triggers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => fetchApi<void>(`/triggers/${id}`, { method: 'DELETE' }),
  fire: (id: string) => fetchApi<{ status: string }>(`/triggers/${id}/fire`, { method: 'POST' }),
};

// Actions
export const actionsApi = {
  getAll: () => fetchApi<Action[]>('/actions'),
  getByTrigger: (triggerId: string) => fetchApi<Action[]>(`/actions/trigger/${triggerId}`),
  getById: (id: string) => fetchApi<Action>(`/actions/${id}`),
  create: (data: { name: string; type: string; config: Record<string, unknown>; triggerId: string; order?: number }) =>
    fetchApi<Action>('/actions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Action> & { config?: Record<string, unknown> }) =>
    fetchApi<Action>(`/actions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => fetchApi<void>(`/actions/${id}`, { method: 'DELETE' }),
  reorder: (triggerId: string, actionIds: string[]) =>
    fetchApi<Action[]>(`/actions/trigger/${triggerId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ actionIds }),
    }),
};

// Events
export const eventsApi = {
  getAll: (page = 1, limit = 50) => 
    fetchApi<PaginatedResponse<EventLog>>(`/events?page=${page}&limit=${limit}`),
  getByDevice: (deviceId: string, limit = 100) => 
    fetchApi<EventLog[]>(`/events/device/${deviceId}?limit=${limit}`),
};


