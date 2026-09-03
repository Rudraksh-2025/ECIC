import type { User } from '../types';
import { iso } from '../utils/dates';
import { initialsOf } from '../utils/format';

const raw: Omit<User, 'initials' | 'avatarColor'>[] = [
  {
    id: 'USR-001', name: 'Nomsa Dlamini', email: 'nomsa.dlamini@ecic.demo.co.za',
    role: 'complaints_specialist', jobTitle: 'Complaints Specialist',
    businessUnit: 'Client Services', team: 'Complaints Team A', phone: '+27 12 471 3001',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 7, 42),
  },
  {
    id: 'USR-002', name: 'Sipho Khumalo', email: 'sipho.khumalo@ecic.demo.co.za',
    role: 'complaints_specialist', jobTitle: 'Complaints Specialist',
    businessUnit: 'Client Services', team: 'Complaints Team B', phone: '+27 12 471 3002',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 8, 5),
  },
  {
    id: 'USR-003', name: 'Adele van Wyk', email: 'adele.vanwyk@ecic.demo.co.za',
    role: 'complaints_supervisor', jobTitle: 'Complaints Supervisor',
    businessUnit: 'Client Services', team: 'Complaints Oversight', phone: '+27 12 471 3010',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 7, 15),
  },
  {
    id: 'USR-004', name: 'Thabo Mokoena', email: 'thabo.mokoena@ecic.demo.co.za',
    role: 'bdu_officer', jobTitle: 'Business Development Officer',
    businessUnit: 'Business Development Unit', team: 'BDU - Manufacturing', phone: '+27 12 471 3101',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 8, 30),
  },
  {
    id: 'USR-005', name: 'Lerato Mahlangu', email: 'lerato.mahlangu@ecic.demo.co.za',
    role: 'bdu_officer', jobTitle: 'Business Development Officer',
    businessUnit: 'Business Development Unit', team: 'BDU - Infrastructure', phone: '+27 12 471 3102',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(-1, 16, 20),
  },
  {
    id: 'USR-006', name: 'Johan Pretorius', email: 'johan.pretorius@ecic.demo.co.za',
    role: 'sales_user', jobTitle: 'Senior Sales Executive',
    businessUnit: 'Business Development Unit', team: 'Sales - Africa', phone: '+27 12 471 3201',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 6, 55),
  },
  {
    id: 'USR-007', name: 'Ayanda Mthembu', email: 'ayanda.mthembu@ecic.demo.co.za',
    role: 'sales_user', jobTitle: 'Sales Executive',
    businessUnit: 'Business Development Unit', team: 'Sales - SADC', phone: '+27 12 471 3202',
    status: 'Active', mfaEnrolled: true, ssoLinked: false, lastLogin: iso(-2, 11, 12),
  },
  {
    id: 'USR-008', name: 'Michelle Naidoo', email: 'michelle.naidoo@ecic.demo.co.za',
    role: 'marketing_user', jobTitle: 'Marketing Manager',
    businessUnit: 'Marketing & Communications', team: 'Campaigns', phone: '+27 12 471 3301',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 8, 41),
  },
  {
    id: 'USR-009', name: 'Kagiso Ramaphosa', email: 'kagiso.ramaphosa@ecic.demo.co.za',
    role: 'marketing_user', jobTitle: 'Marketing Communications Specialist',
    businessUnit: 'Marketing & Communications', team: 'Brand & CIM', phone: '+27 12 471 3302',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(-1, 9, 33),
  },
  {
    id: 'USR-010', name: 'Riaan Botha', email: 'riaan.botha@ecic.demo.co.za',
    role: 'underwriting_user', jobTitle: 'Senior Underwriter - STI',
    businessUnit: 'Underwriting', team: 'Short-Term Insurance', phone: '+27 12 471 3401',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 7, 58),
  },
  {
    id: 'USR-011', name: 'Fatima Patel', email: 'fatima.patel@ecic.demo.co.za',
    role: 'underwriting_user', jobTitle: 'Underwriter - MLT',
    businessUnit: 'Underwriting', team: 'Medium/Long-Term Insurance', phone: '+27 12 471 3402',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(-1, 14, 2),
  },
  {
    id: 'USR-012', name: 'Dr Bongani Zulu', email: 'bongani.zulu@ecic.demo.co.za',
    role: 'executive', jobTitle: 'Chief Operations Officer',
    businessUnit: 'Executive Office', team: 'Exco', phone: '+27 12 471 3501',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 6, 20),
  },
  {
    id: 'USR-013', name: 'Precious Sithole', email: 'precious.sithole@ecic.demo.co.za',
    role: 'executive', jobTitle: 'Executive Manager: Client Coverage',
    businessUnit: 'Executive Office', team: 'Exco', phone: '+27 12 471 3502',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(-3, 10, 45),
  },
  {
    id: 'USR-014', name: 'Devan Reddy', email: 'devan.reddy@ecic.demo.co.za',
    role: 'system_administrator', jobTitle: 'CRM System Administrator',
    businessUnit: 'Information Technology', team: 'Business Applications', phone: '+27 12 471 3601',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 7, 2),
  },
  {
    id: 'USR-015', name: 'Zanele Nkosi', email: 'zanele.nkosi@ecic.demo.co.za',
    role: 'system_administrator', jobTitle: 'IT Security Administrator',
    businessUnit: 'Information Technology', team: 'Information Security', phone: '+27 12 471 3602',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(-1, 8, 8),
  },
  {
    id: 'USR-016', name: 'Pieter Coetzee', email: 'pieter.coetzee@ecic.demo.co.za',
    role: 'complaints_specialist', jobTitle: 'Complaints Specialist',
    businessUnit: 'Client Services', team: 'Complaints Team A', phone: '+27 12 471 3003',
    status: 'Suspended', mfaEnrolled: false, ssoLinked: true, lastLogin: iso(-46, 15, 30),
  },
  {
    id: 'USR-017', name: 'Naledi Modise', email: 'naledi.modise@ecic.demo.co.za',
    role: 'bdu_officer', jobTitle: 'Business Development Officer',
    businessUnit: 'Business Development Unit', team: 'BDU - Mining & Energy', phone: '+27 12 471 3103',
    status: 'Active', mfaEnrolled: true, ssoLinked: true, lastLogin: iso(0, 9, 10),
  },
  {
    id: 'USR-018', name: 'Grace Mabaso', email: 'grace.mabaso@ecic.demo.co.za',
    role: 'portal_customer', jobTitle: 'Finance Director (Client)',
    businessUnit: 'External', team: 'Portal Users', phone: '+27 11 555 8820',
    status: 'Active', mfaEnrolled: true, ssoLinked: false, lastLogin: iso(0, 8, 55),
  },
];

const palette = [
  '#0B2545', '#0E7C7B', '#2563EB', '#7C3AED', '#C9A227', '#DC2626',
  '#059669', '#D97706', '#13315C', '#0891B2',
];

export const USERS: User[] = raw.map((u, i) => ({
  ...u,
  initials: initialsOf(u.name),
  avatarColor: palette[i % palette.length],
}));

export const userById = (id: string | null | undefined): User | undefined =>
  id ? USERS.find((u) => u.id === id) : undefined;

export const userName = (id: string | null | undefined): string =>
  userById(id)?.name ?? 'Unassigned';
