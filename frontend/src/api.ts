const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  picture?: string;
  authMethod?: 'phone' | 'social';
  tokenBalance: number;
  communityIds: string[];
  isSuperAdmin?: boolean;
  createdAt?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  adminId: string;
  inviteCode: string;
  createdAt: string;
}

export interface Item {
  id: string;
  communityId: string;
  userId: string;
  title: string;
  description: string;
  category: 'books' | 'toys' | 'games' | 'bikes' | 'other';
  tokenValue: number;
  imageUrl?: string;
  googleBookId?: string;
  ownerName?: string;
  status: 'available' | 'reserved' | 'traded';
  interestCount?: number;
  myInterest?: boolean;
  myInterestId?: string;
  createdAt: string;
}

export interface TradeMatch {
  type: '2way' | '3way' | '4way';
  participants: string[];
  participantNames: string[];
  itemChain: string[];
  itemTitles: string[];
}

export interface Trade {
  id: string;
  type: '2way' | '3way' | '4way';
  participants: string[];
  participantNames: string[];
  itemChain: string[];
  itemTitles: string[];
  status: string;
  communityId?: string;
  createdAt: string;
}

export interface BookResult {
  id: string;
  title: string;
  authors: string[];
  imageUrl?: string;
  description?: string;
}

export interface AdminBrowseEntry {
  name: string;
  isDir: boolean;
  size: number;
  modified: string;
  path: string;
}

export interface AdminConfig {
  dataDir: string;
  environment: string;
  pythonVersion: string;
  userCount: number;
  communityCount: number;
  itemCount: number;
  totalDataFiles: number;
  superAdmins: string[];
  config: Record<string, string | boolean>;
}

export interface DataIssue {
  type: string;
  severity: 'warning' | 'error';
  description: string;
  fix: string | null;
  itemId?: string;
  interestId?: string;
  communityId?: string;
  userId?: string;
  [key: string]: unknown;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || `HTTP ${res.status}`);
  }
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const authCheckPhone = (phone: string) =>
  request<{ exists: boolean }>('/api/check-phone', json('POST', { phone }));

export const loginWithPin = (phone: string, pin: string) =>
  request<{ success: boolean; user?: User; message?: string }>('/api/login', json('POST', { phone, pin }));

export const signup = (phone: string, firstName: string, lastName: string, email: string, pin: string) =>
  request<{ success: boolean; user?: User; message?: string }>('/api/signup',
    json('POST', { phone, firstName, lastName, email, pin }));

export const getMyCommunities = (phone: string) =>
  request<Community[]>(`/api/communities?phone=${encodeURIComponent(phone)}`);

export const getAllCommunities = (phone: string) =>
  request<Community[]>(`/api/communities/all?phone=${encodeURIComponent(phone)}`);

export const createCommunity = (phone: string, name: string, description: string) =>
  request<{ success: boolean; community: Community; user?: User }>('/api/communities',
    json('POST', { phone, name, description }));

export const joinCommunity = (phone: string, inviteCode: string) =>
  request<{ success: boolean; community?: Community; user?: User; message?: string }>('/api/communities/join',
    json('POST', { phone, inviteCode }));

export const getCommunityItems = (communityId: string, phone: string) =>
  request<Item[]>(`/api/items?communityId=${encodeURIComponent(communityId)}&phone=${encodeURIComponent(phone)}`);

export const addItem = (payload: Partial<Item> & { phone: string; communityId: string }) =>
  request<{ success: boolean; item: Item }>('/api/items', json('POST', payload));

export const updateItemStatus = (id: string, phone: string, status: Item['status']) =>
  request<{ success: boolean; item: Item }>(`/api/items/${id}`, json('PATCH', { phone, status }));

export const deleteItem = (id: string, phone: string) =>
  request<{ success: boolean }>(`/api/items/${id}?phone=${encodeURIComponent(phone)}`, { method: 'DELETE' });

export const expressInterest = (phone: string, itemId: string) =>
  request<{ success: boolean; interest: { id: string } }>('/api/interests', json('POST', { phone, itemId }));

export const removeInterest = (interestId: string, phone: string) =>
  request<{ success: boolean }>(`/api/interests/${interestId}?phone=${encodeURIComponent(phone)}`, { method: 'DELETE' });

export const getMyInterests = (phone: string) =>
  request<Item[]>(`/api/interests/my?phone=${encodeURIComponent(phone)}`);

export const getTradeMatches = (communityId: string, phone: string) =>
  request<TradeMatch[]>(`/api/trades/matches?communityId=${encodeURIComponent(communityId)}&phone=${encodeURIComponent(phone)}`);

export const proposeTrade = (phone: string, participantIds: string[], itemChain: string[], type: TradeMatch['type']) =>
  request<{ success: boolean; trade: Trade }>('/api/trades', json('POST', { phone, participantIds, itemChain, type }));

export const getMyTrades = (phone: string) =>
  request<Trade[]>(`/api/trades?phone=${encodeURIComponent(phone)}`);

export const updateTradeStatus = (id: string, phone: string, status: string) =>
  request<{ success: boolean; trade: Trade }>(`/api/trades/${id}`, json('PATCH', { phone, status }));

export const searchBooks = (q: string) =>
  request<BookResult[]>(`/api/search/books?q=${encodeURIComponent(q)}`);

export const getAllUsers = (phone: string) =>
  request<User[]>(`/api/users/all?phone=${encodeURIComponent(phone)}`);

export const adminLoginAs = (phone: string, targetPhone: string) =>
  request<{ success: boolean; user: User }>('/api/admin/login-as', json('POST', { phone, targetPhone }));

export const deleteAdminUser = (id: string, phone: string) =>
  request<{ success: boolean }>(`/api/admin/users/${id}?phone=${encodeURIComponent(phone)}`, { method: 'DELETE' });

export const deleteAdminCommunity = (id: string, phone: string) =>
  request<{ success: boolean }>(`/api/admin/communities/${id}?phone=${encodeURIComponent(phone)}`, { method: 'DELETE' });

export const adminBrowseData = (phone: string, path = '') =>
  request<{ path: string; dataDir: string; entries: AdminBrowseEntry[] }>(
    `/api/admin/data/browse?phone=${encodeURIComponent(phone)}&path=${encodeURIComponent(path)}`
  );

export const adminReadFile = (phone: string, path: string) =>
  request<{ path: string; content: string }>(
    `/api/admin/data/file?phone=${encodeURIComponent(phone)}&path=${encodeURIComponent(path)}`
  );

export const adminGetConfig = (phone: string) =>
  request<AdminConfig>(
    `/api/admin/config?phone=${encodeURIComponent(phone)}`
  );

export const socialAuth = (email: string, name: string, picture: string) =>
  request<{ success: boolean; user?: User; message?: string }>('/api/auth/social',
    json('POST', { email, name, picture }));

export const adminDataDownloadUrl = (phone: string, path = '') =>
  `${API_BASE}/api/admin/data/download?phone=${encodeURIComponent(phone)}&path=${encodeURIComponent(path)}`;

export const adminAuditData = (phone: string) =>
  request<{ success: boolean; issues: DataIssue[]; total: number; message?: string }>(
    `/api/admin/maintenance/audit?phone=${encodeURIComponent(phone)}`
  );

export const adminSyncMembership = (phone: string) =>
  request<{ success: boolean; message: string; communitiesUpdated: number; usersUpdated: number }>(
    '/api/admin/maintenance/sync-membership', json('POST', { phone })
  );

export const adminFixOrphans = (phone: string, fixType: string) =>
  request<{ success: boolean; deleted: number }>(
    '/api/admin/maintenance/fix-orphans', json('POST', { phone, fixType })
  );
