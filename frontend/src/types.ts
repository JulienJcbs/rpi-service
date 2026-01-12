export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  devices?: Device[];
}

export interface Device {
  id: string;
  name: string;
  description?: string;
  hostname?: string;
  ipAddress?: string;
  isOnline: boolean;
  lastSeen?: string;
  groupId?: string;
  group?: Group;
  createdAt: string;
  updatedAt: string;
  triggers?: Trigger[];
}

export interface TriggerConfig {
  // GPIO Input
  pin?: number;
  edge?: 'rising' | 'falling' | 'both';
  pull?: 'up' | 'down' | 'none';
  debounce?: number;
  // Schedule
  cron?: string;
  timezone?: string;
  // API Call
  method?: 'GET' | 'POST';
  secret?: string;
}

export interface Trigger {
  id: string;
  name: string;
  description?: string;
  type: 'gpio_input' | 'schedule' | 'api_call';
  config: string;
  isEnabled: boolean;
  deviceId: string;
  device?: Device;
  actions?: Action[];
  createdAt: string;
  updatedAt: string;
}

export interface ActionConfig {
  // GPIO Output
  pin?: number;
  state?: 'high' | 'low' | 'toggle';
  duration?: number;
  // HTTP Request
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  // Delay
}

export interface Action {
  id: string;
  name: string;
  type: 'gpio_output' | 'http_request' | 'delay';
  config: string;
  order: number;
  triggerId: string;
  trigger?: Trigger;
  createdAt: string;
  updatedAt: string;
}

export interface EventLog {
  id: string;
  deviceId: string;
  triggerId?: string;
  actionId?: string;
  type: string;
  message: string;
  metadata?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  events: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

