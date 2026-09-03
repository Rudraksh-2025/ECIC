import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Activity, AppNotification, Application, AuditEvent, Campaign, ChatSession, CimVersion,
  Complaint, Configuration, Contact, CrmDocument, CrmEvent, Customer, Faq, Integration,
  Lead, MarketingAsset, Opportunity, Organizer, RoleId, Task, User,
} from '../types';
import { buildSeed } from '../data/seed';
import { ROLES } from '../data/roles';

export interface SavedReport {
  id: string;
  name: string;
  dataset: string;
  fields: string[];
  groupBy: string;
  filters: Record<string, string>;
  sortBy: string;
  createdAt: string;
  createdBy: string;
}

export interface OfflineCapture {
  id: string;
  eventId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  sector: string;
  product: string;
  capturedAt: string;
  status: 'Stored Offline' | 'Synced';
  leadId: string | null;
}

interface Session {
  role: RoleId;
  userId: string;
  authenticated: boolean;
  mfaVerified: boolean;
  showSensitiveData: boolean;
  presentationMode: boolean;
  demoStep: number;
  completedSteps: number[];
  portalCustomerId: string;
  portalAuthenticated: boolean;
}

export interface CrmState {
  customers: Customer[];
  contacts: Contact[];
  users: User[];
  complaints: Complaint[];
  leads: Lead[];
  opportunities: Opportunity[];
  applications: Application[];
  documents: CrmDocument[];
  campaigns: Campaign[];
  events: CrmEvent[];
  organizers: Organizer[];
  cimVersions: CimVersion[];
  marketingAssets: MarketingAsset[];
  activities: Activity[];
  tasks: Task[];
  notifications: AppNotification[];
  auditEvents: AuditEvent[];
  faqs: Faq[];
  chatSessions: ChatSession[];
  integrations: Integration[];
  configuration: Configuration;
  savedReports: SavedReport[];
  offlineCaptures: OfflineCapture[];
  session: Session;

  /** Generic patch helper used by the mock service layer. */
  apply: (fn: (state: CrmState) => void) => void;
  setSession: (patch: Partial<Session>) => void;
  resetDemo: () => void;
}

const DEFAULT_SESSION: Session = {
  role: 'complaints_supervisor',
  userId: 'USR-003',
  authenticated: true,
  mfaVerified: true,
  showSensitiveData: false,
  presentationMode: false,
  demoStep: 1,
  completedSteps: [],
  portalCustomerId: 'CUS-0001',
  portalAuthenticated: false,
};

function freshState() {
  const seed = buildSeed();
  return {
    ...seed,
    savedReports: [] as SavedReport[],
    offlineCaptures: [] as OfflineCapture[],
    session: { ...DEFAULT_SESSION },
  };
}

export const STORAGE_KEY = 'ecic-crm-demo-v1';

export const useStore = create<CrmState>()(
  persist(
    (set) => ({
      ...freshState(),
      apply: (fn) =>
        set((state) => {
          const draft = { ...state };
          fn(draft);
          return draft;
        }),
      setSession: (patch) => set((state) => ({ session: { ...state.session, ...patch } })),
      resetDemo: () => set(() => freshState()),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => {
        const { apply: _a, setSession: _b, resetDemo: _c, ...rest } = state;
        void _a; void _b; void _c;
        return rest;
      },
    },
  ),
);

/* ------------------------------------------------------------------ */
/* Convenience selectors and permission helpers                        */
/* ------------------------------------------------------------------ */

export const useSession = () => useStore((s) => s.session);

export function useCurrentUser(): User {
  const users = useStore((s) => s.users);
  const userId = useStore((s) => s.session.userId);
  return users.find((u) => u.id === userId) ?? users[0];
}

export function useRole() {
  const role = useStore((s) => s.session.role);
  return ROLES[role];
}

export function usePermission(permission: string): boolean {
  const role = useStore((s) => s.session.role);
  return (ROLES[role]?.permissions as string[]).includes(permission);
}

export function useCanSeeModule(moduleKey: string): boolean {
  const role = useStore((s) => s.session.role);
  return ROLES[role]?.modules.includes(moduleKey) ?? false;
}

/** Whether personal information should be masked for the active session. */
export function useMasking(): boolean {
  const role = useStore((s) => s.session.role);
  const show = useStore((s) => s.session.showSensitiveData);
  const maskDefault = useStore((s) => s.configuration.security.maskPiiByDefault);
  const canUnmask = ROLES[role]?.permissions.includes('pii.unmask');
  if (!maskDefault) return false;
  return !(canUnmask && show);
}
