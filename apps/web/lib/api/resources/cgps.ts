// ─── CGPs resource ───────────────────────────────────────────────────────────
// Thin typed wrappers around the `/cgps` endpoints.

import { apiClient } from '../client';
import type { CGP, CGPUpdate } from '../types';

export const cgpsApi = {
  me: () => apiClient.get<CGP>('/cgps/me'),
  updateMe: (patch: CGPUpdate) => apiClient.patch<CGP>('/cgps/me', patch),
};
