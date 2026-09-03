import type { Contact, Customer } from '../types';
import { isoDate } from '../utils/dates';

interface Row {
  org: string; contact: string; type: Customer['customerType']; sector: string;
  country: string; city: string; status: Customer['status']; owner: string;
  channel: Customer['preferredChannel']; created: number; value: number;
}

const rows: Row[] = [
  { org: 'Highveld Steel & Vanadium (Pty) Ltd', contact: 'Grace Mabaso', type: 'Exporter', sector: 'Metals & Mining', country: 'South Africa', city: 'eMalahleni', status: 'Active', owner: 'USR-004', channel: 'Email', created: -820, value: 1_480_000_000 },
  { org: 'Kalahari Agri Processing SOC', contact: 'Willem de Beer', type: 'Exporter', sector: 'Agriculture & Agro-processing', country: 'South Africa', city: 'Upington', status: 'Active', owner: 'USR-004', channel: 'Email', created: -640, value: 385_000_000 },
  { org: 'Rand Merchant Trade Finance', contact: 'Priya Govender', type: 'Financial Institution', sector: 'Banking', country: 'South Africa', city: 'Johannesburg', status: 'Active', owner: 'USR-006', channel: 'Telephone', created: -1210, value: 2_950_000_000 },
  { org: 'Zambezi Power Holdings Ltd', contact: 'Chanda Mulenga', type: 'Project Sponsor', sector: 'Energy & Power', country: 'Zambia', city: 'Lusaka', status: 'Active', owner: 'USR-005', channel: 'Email', created: -540, value: 4_200_000_000 },
  { org: 'Cape Peninsula Marine Engineering', contact: 'Anton Fourie', type: 'Exporter', sector: 'Marine & Shipbuilding', country: 'South Africa', city: 'Cape Town', status: 'Active', owner: 'USR-006', channel: 'Email', created: -410, value: 620_000_000 },
  { org: 'Tembisa Rail Components (Pty) Ltd', contact: 'Sibusiso Ngwenya', type: 'Exporter', sector: 'Rail & Transport', country: 'South Africa', city: 'Kempton Park', status: 'Active', owner: 'USR-017', channel: 'Portal', created: -300, value: 275_000_000 },
  { org: 'Namib Desert Logistics CC', contact: 'Helena Shipanga', type: 'Exporter', sector: 'Logistics', country: 'Namibia', city: 'Walvis Bay', status: 'Prospect', owner: 'USR-005', channel: 'Email', created: -95, value: 118_000_000 },
  { org: 'Accra Infrastructure Partners Ltd', contact: 'Kwame Boateng', type: 'Project Sponsor', sector: 'Construction & Infrastructure', country: 'Ghana', city: 'Accra', status: 'Active', owner: 'USR-005', channel: 'Email', created: -260, value: 3_100_000_000 },
  { org: 'Gauteng Pharma Manufacturing SOC', contact: 'Dr Rebecca Sithole', type: 'Exporter', sector: 'Pharmaceutical', country: 'South Africa', city: 'Midrand', status: 'Active', owner: 'USR-004', channel: 'Email', created: -720, value: 440_000_000 },
  { org: 'Standard Trade Bank of Botswana', contact: 'Tebogo Kgosi', type: 'Financial Institution', sector: 'Banking', country: 'Botswana', city: 'Gaborone', status: 'Active', owner: 'USR-006', channel: 'Telephone', created: -880, value: 1_650_000_000 },
  { org: 'Mozambique LNG Services Lda', contact: 'Ana Macuácua', type: 'Project Sponsor', sector: 'Oil & Gas', country: 'Mozambique', city: 'Maputo', status: 'Active', owner: 'USR-017', channel: 'Email', created: -190, value: 5_800_000_000 },
  { org: 'Durban Textile Exporters (Pty) Ltd', contact: 'Yusuf Ismail', type: 'Exporter', sector: 'Textiles & Apparel', country: 'South Africa', city: 'Durban', status: 'Active', owner: 'USR-004', channel: 'Email', created: -455, value: 96_000_000 },
  { org: 'Lagos Renewable Energy Ltd', contact: 'Adebayo Okonkwo', type: 'Project Sponsor', sector: 'Energy & Power', country: 'Nigeria', city: 'Lagos', status: 'Prospect', owner: 'USR-005', channel: 'Email', created: -60, value: 2_400_000_000 },
  { org: 'Free State Grain Handling SOC', contact: 'Marius Lombard', type: 'Exporter', sector: 'Agriculture & Agro-processing', country: 'South Africa', city: 'Bloemfontein', status: 'Active', owner: 'USR-017', channel: 'Telephone', created: -610, value: 210_000_000 },
  { org: 'Kigali Digital Infrastructure Ltd', contact: 'Uwase Mukamana', type: 'Project Sponsor', sector: 'Telecommunications', country: 'Rwanda', city: 'Kigali', status: 'Onboarding', owner: 'USR-005', channel: 'Portal', created: -42, value: 890_000_000 },
  { org: 'Port Elizabeth Automotive Components', contact: 'Charl van Rensburg', type: 'Exporter', sector: 'Automotive', country: 'South Africa', city: 'Gqeberha', status: 'Active', owner: 'USR-006', channel: 'Email', created: -935, value: 730_000_000 },
  { org: 'Trade Assure Brokers (Pty) Ltd', contact: 'Nadia Abrahams', type: 'Broker', sector: 'Insurance Broking', country: 'South Africa', city: 'Sandton', status: 'Active', owner: 'USR-007', channel: 'Email', created: -1100, value: 0 },
  { org: 'Dar es Salaam Port Works Ltd', contact: 'Juma Mwakalinga', type: 'Project Sponsor', sector: 'Construction & Infrastructure', country: 'Tanzania', city: 'Dar es Salaam', status: 'Active', owner: 'USR-017', channel: 'Email', created: -370, value: 1_950_000_000 },
  { org: 'Limpopo Citrus Growers Co-operative', contact: 'Tshepo Malatji', type: 'Exporter', sector: 'Agriculture & Agro-processing', country: 'South Africa', city: 'Polokwane', status: 'Active', owner: 'USR-004', channel: 'SMS', created: -285, value: 145_000_000 },
  { org: 'Windhoek Mining Equipment (Pty) Ltd', contact: 'Erastus Nangolo', type: 'Exporter', sector: 'Metals & Mining', country: 'Namibia', city: 'Windhoek', status: 'Dormant', owner: 'USR-007', channel: 'Email', created: -1420, value: 62_000_000 },
  { org: 'Nairobi Agritech Solutions Ltd', contact: 'Wanjiru Kamau', type: 'Exporter', sector: 'Agriculture & Agro-processing', country: 'Kenya', city: 'Nairobi', status: 'Prospect', owner: 'USR-005', channel: 'Email', created: -28, value: 78_000_000 },
  { org: 'Vaal Chemical Industries SOC', contact: 'Hendrik Steyn', type: 'Exporter', sector: 'Chemicals', country: 'South Africa', city: 'Vanderbijlpark', status: 'Active', owner: 'USR-006', channel: 'Email', created: -790, value: 1_120_000_000 },
  { org: 'Harare Water Utilities Ltd', contact: 'Tendai Chikwanha', type: 'Project Sponsor', sector: 'Water & Sanitation', country: 'Zimbabwe', city: 'Harare', status: 'Onboarding', owner: 'USR-017', channel: 'Email', created: -75, value: 1_380_000_000 },
  { org: 'Eastern Cape Wind Farm Consortium', contact: 'Lindiwe Jacobs', type: 'Project Sponsor', sector: 'Energy & Power', country: 'South Africa', city: 'East London', status: 'Active', owner: 'USR-006', channel: 'Portal', created: -220, value: 2_700_000_000 },
  { org: 'Abidjan Cocoa Processing SA', contact: 'Yao Koffi', type: 'Exporter', sector: 'Agriculture & Agro-processing', country: "Côte d'Ivoire", city: 'Abidjan', status: 'Prospect', owner: 'USR-005', channel: 'Email', created: -50, value: 155_000_000 },
  { org: 'ECIC Internal - Finance Division', contact: 'Andries Meyer', type: 'Internal', sector: 'Internal', country: 'South Africa', city: 'Centurion', status: 'Active', owner: 'USR-003', channel: 'Email', created: -1500, value: 0 },
  { org: 'Pretoria Defence Systems (Pty) Ltd', contact: 'Colonel (Ret.) Neo Setshedi', type: 'Exporter', sector: 'Defence & Aerospace', country: 'South Africa', city: 'Centurion', status: 'Active', owner: 'USR-004', channel: 'Telephone', created: -505, value: 980_000_000 },
];

function emailFor(name: string, org: string): string {
  const local = name.toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).slice(-2).join('.');
  const domain = org.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).slice(0, 2).join('') + '.demo.africa';
  return `${local}@${domain}`;
}

const dial: Record<string, string> = {
  'South Africa': '+27 1', Zambia: '+260 21', Namibia: '+264 61', Ghana: '+233 30',
  Botswana: '+267 39', Mozambique: '+258 21', Nigeria: '+234 1', Rwanda: '+250 78',
  Tanzania: '+255 22', Kenya: '+254 20', Zimbabwe: '+263 24', "Côte d'Ivoire": '+225 27',
};

export const CUSTOMERS: Customer[] = rows.map((r, i) => ({
  id: `CUS-${String(i + 1).padStart(4, '0')}`,
  organisation: r.org,
  contactPerson: r.contact,
  customerType: r.type,
  email: emailFor(r.contact, r.org),
  phone: `${dial[r.country] ?? '+27 1'}${(1000000 + i * 74321).toString().slice(0, 7)}`,
  country: r.country,
  sector: r.sector,
  preferredChannel: r.channel,
  status: r.status,
  createdDate: isoDate(r.created),
  accountOwnerId: r.owner,
  registrationNo: `${2003 + (i % 20)}/${(100000 + i * 8117).toString().slice(0, 6)}/07`,
  annualExportValue: r.value,
  city: r.city,
  consentMarketing: i % 5 !== 0,
  consentDataProcessing: true,
  retentionUntil: isoDate(r.created + 2555),
}));

export const CONTACTS: Contact[] = CUSTOMERS.flatMap((c, i) => {
  const secondNames = [
    ['Financial Manager', 'Trade Finance Lead'],
    ['Export Manager', 'Compliance Officer'],
    ['Treasury Analyst', 'Operations Director'],
  ][i % 3];
  const firsts = [
    ['Nomvula Bhengu', 'Deon Marais'], ['Tumelo Radebe', 'Sarah Adams'],
    ['Farai Ndlovu', 'Karin Louw'], ['Blessing Achieng', 'Ruan Vermeulen'],
  ][i % 4];
  return [
    {
      id: `CON-${c.id}-1`, customerId: c.id, name: c.contactPerson,
      jobTitle: 'Primary Commercial Contact', email: c.email, phone: c.phone, primary: true,
    },
    {
      id: `CON-${c.id}-2`, customerId: c.id, name: firsts[0],
      jobTitle: secondNames[0], email: emailFor(firsts[0], c.organisation),
      phone: `${c.phone.slice(0, -2)}${(11 + i) % 90}`, primary: false,
    },
    {
      id: `CON-${c.id}-3`, customerId: c.id, name: firsts[1],
      jobTitle: secondNames[1], email: emailFor(firsts[1], c.organisation),
      phone: `${c.phone.slice(0, -2)}${(31 + i) % 90}`, primary: false,
    },
  ];
});

export const customerById = (id: string | null | undefined): Customer | undefined =>
  id ? CUSTOMERS.find((c) => c.id === id) : undefined;

export const customerName = (id: string | null | undefined): string =>
  customerById(id)?.organisation ?? '—';

/** Canonical ECIC sector list. Covers every sector used by customers, leads and
 *  exhibition capture, so that pickers are never missing a value in use. */
export const SECTORS = Array.from(new Set([
  ...CUSTOMERS.map((c) => c.sector),
  'Manufacturing', 'Forestry', 'Tourism', 'Food & Beverage', 'Construction Materials',
  'Information Technology', 'Professional Services', 'Renewable Energy',
])).filter((s) => s !== 'Internal').sort();
export const COUNTRIES = Array.from(new Set(CUSTOMERS.map((c) => c.country))).sort();
