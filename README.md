# ECIC CRM Platform — Bid Demonstration Build

A frontend-only, fully interactive demonstration of a CRM platform for the ECIC
(Export Credit Insurance Corporation) CRM Platform RFP. Built with React,
TypeScript, Material UI and Recharts. There is no backend — every workflow
runs against a typed mock service layer over data held in `localStorage`, so
the demonstration is self-contained, fast, and safe to run offline during a
live bid presentation.

**This is a bid demonstration product, not a production system.** Controls
that cannot genuinely exist in a browser-only build — SSO, MFA, encryption,
malware scanning, backup, disaster recovery — are clearly labelled
`DEMO / SIMULATED` throughout the interface. See [Known Simulations](#known-simulations).

---

## A. Implementation Summary

The application implements the full information architecture requested for
the ECIC CRM bid demonstration:

- **Executive Dashboard** with 12 live KPIs and 9 charts, fully filterable
- **Complaints / Case Management**: multi-channel capture, SLA engine,
  escalation (manual and automatic on dissatisfaction), investigation,
  resolution, controlled closure with segregation of duties
- **Leads**: multi-channel capture, live duplicate detection, mandatory
  owner + backup owner assignment, configurable desktop analysis, lead → 
  opportunity conversion wizard with full traceability
- **Opportunities**: drag-and-drop Kanban pipeline, multi-product lines, time
  in stage vs. portfolio average, mandatory closed-lost reason, protected
  closed records, underwriting handover with SoD
- **Digital Applications**: configurable multi-section forms, draft
  auto-save, simulated digital signature with locking, underwriting decision
- **Documents**: upload with simulated security scanning (including a
  demonstrable blocked file), classification, versioning, automatic linking
  to every related record, full traceability chain
- **WIP / Underwriting Pipeline**: BDU → underwriting handover with
  continued BDU visibility after handover
- **Marketing**: campaign templates with mandatory-field enforcement,
  approval workflow, events with organiser profiles, QR exhibition capture
  (including offline mode + sync), campaign/event ROI with recommendations
- **Corporate Identity Manual**: version control, four-step approval
  workflow, automated compliance checklist on marketing assets
- **Reporting**: 19 standard reports across 8 categories + a no-code report
  builder, Excel/CSV and print-ready PDF export with timestamps
- **Analytics**: revenue forecasting (best case / commit / weighted / won),
  win-loss analysis, pipeline by stage/owner/sector
- **Security Centre**: 9 security/privacy controls, live PII masking,
  working MFA simulation, assurance evidence register
- **Users & Roles**: 9 roles, full permission matrix, live role switching
- **Configuration Centre**: no-code configuration of statuses, categories,
  SLA rules, templates, mandatory fields, approval steps, desktop analysis
  fields and security settings — every change takes effect immediately
- **Audit Log**: 100+ seeded events + everything created live in the
  session, read-only, chained integrity hash
- **Customer Portal**: a visually distinct external experience — cases,
  enquiries, applications, documents, FAQs, chat — over the same data model
- **Chatbot / Live Chat**: FAQ-driven bot with urgent-query escalation to a
  simulated live agent and case creation from the transcript
- **Implementation & Support**: 9-phase delivery plan, RAID register,
  training, change management, team structure, SLA tiers, hypercare,
  business continuity
- **Bid Demo Mode**: an 18-step guided presentation sequence with talking
  points, requirement evidence and a Phase Four coverage checklist
- **Requirement Coverage Matrix**: all 101 Annexure C requirements, each
  mapped to a module, screen, evidence statement and honest status, with
  deep links from anywhere in the app

---

## B. Route Map

### Internal CRM (`AppShell`)
```
/dashboard
/my-work
/leads                         /leads/new                  /leads/:id
/opportunities                 /opportunities/:id
/complaints                    /complaints/new              /complaints/:id
/customers                     /customers/:id
/applications                  /applications/new             /applications/:id
/documents
/pipeline
/campaigns                     /campaigns/:id
/events                        /events/:id
/qr-capture
/campaign-performance
/cim
/reports                       /reports/:id
/analytics
/tasks
/notifications
/chat
/faqs
/audit
/security
/users
/configuration
/integrations
/implementation
/bid-demo
/coverage
```

### Customer Portal (`PortalShell`, distinct visual identity)
```
/portal
/portal/cases                  /portal/cases/new
/portal/enquiries               /portal/enquiries/new
/portal/applications
/portal/documents
/portal/faqs
/portal/chat
/portal/profile
```

### Authentication
```
/login
```

---

## C. Demo Users / Roles

Nine roles are pre-seeded with active users; the role switcher (header, or
Users & Roles → Role definitions) instantly re-scopes navigation, actions and
data visibility:

| Role | Example user | Segregation of duties |
|---|---|---|
| Complaints Specialist | Nomsa Dlamini | Investigates; cannot close |
| Complaints Supervisor | Adele van Wyk | Reviews, escalates, closes |
| BDU Officer | Thabo Mokoena | Originates leads/handover; not the underwriting decision |
| Sales User | Johan Pretorius | Progresses opportunities; closed records read-only |
| Marketing User | Michelle Naidoo | Creates campaigns/assets; separate CIM approver |
| Underwriting User | Riaan Botha | Decides applications originated by others |
| Executive | Dr Bongani Zulu | Full visibility, no transactional edit rights |
| System Administrator | Devan Reddy | Configures the platform; no transactional rights |
| Customer (Portal User) | Grace Mabaso | Own organisation's records only |

---

## D. Demo Script (recommended live presentation sequence)

The exact sequence, with talking points, requirement evidence and expected
outcomes, is built into **Bid Demo Mode** (`/bid-demo`). Eighteen steps in
order:

1. Executive Dashboard — 2. Complaint Logging — 3. SLA / Escalation —
4. Closure & SoD — 5. Lead Capture & Duplicate Detection —
6. Desktop Analysis & Conversion — 7. Opportunity Pipeline —
8. Digital Application & Signature — 9. Document Traceability —
10. QR Exhibition Capture — 11. Campaign & Event ROI —
12. CIM Governance — 13. Customer Portal, Chatbot & FAQs —
14. Reporting & Export — 15. Security, Roles & MFA — 16. Audit Log —
17. Configuration Without Coding — 18. (wrap) Implementation Approach

Turn on **Presentation Mode** (toggle in Bid Demo Mode or the profile menu)
to collapse the sidebar and enlarge content for projection.

---

## E. Requirement Coverage

All **101** Annexure C requirements are catalogued in `/coverage`, each with:
area, requirement text, CRM module, demo screen, a direct link to that
screen, a plain-English evidence statement and an honest status:

- **Demonstrated** — genuinely implemented and can be exercised live
- **Configuration Demo** — met by changing configuration, no code, no deploy
- **Simulated** — a control that cannot exist in a browser demo (encryption,
  SSO, malware scanning, DR…), clearly labelled, with the real workflow and
  audit trail shown around it
- **Partially Demonstrated** — part shown live, remainder described

The matrix is searchable by requirement number, keyword, module or screen —
built to answer "how does your solution address requirement 57?" in seconds.

---

## F. Phase Four Coverage

| Area | Points | Where it's demonstrated |
|---|---|---|
| Implementation Approach | 40 | `/implementation` — 9-phase plan, RAID, training, change management, named team + backups, P1–P4 SLA tiers, hypercare, business continuity (RTO/RPO) |
| Ease of Use | 20 | Complaint & lead lifecycles end-to-end in minutes, consistent app shell, responsive layout, `/configuration` no-code changes |
| Reporting | 20 | `/dashboard` (12 KPIs/9 charts), `/reports` (19 standard reports + no-code builder), Excel/PDF export with timestamps |
| Security | 20 | `/security` — RBAC/SoD (live role switching), MFA simulation, PII masking, audit log, file-scan blocking, assurance register |

`/bid-demo` tracks a **presenter checklist** against these four areas —
explicitly labelled as coverage evidence, not an awarded score.

---

## G. Run Instructions

```bash
npm install
npm run dev        # starts Vite on http://localhost:5173
```

```bash
npm run build       # production build (tsc -b && vite build)
npm run preview      # preview the production build
```

### Verification (optional — requires a local Chrome install)

The `tests/` directory contains Puppeteer-driven browser verification
scripts used during development. They are not part of the app bundle.

```bash
npm run dev &                # start the dev server first
npm run verify:routes         # smoke-test every route for runtime errors
npm run verify                # drive the full set of interactive workflows
npm run screenshots           # capture reference screenshots to ./screenshots
```

### Resetting demo data

Any role → profile menu → **Reset demo environment**, or Configuration
Centre → **Reset demo environment**. This restores the original seed data,
clears every change made in the browser session (records, configuration,
audit log, demo progress) and reloads.

---

## Known Simulations

Everything below is honestly labelled `DEMO / SIMULATED` in the interface
itself. It represents the intended production operating model; none of it is
implemented as a real production control in this frontend-only build:

- **Authentication / SSO** — no identity provider is contacted
- **MFA** — the one-time code is generated and validated in the browser
- **Digital signature** — captures signer, consent, timestamp, device and
  locks the document, but is not a qualified electronic signature
- **File / malware scanning** — the Scanning → Safe/Blocked sequence and the
  double-extension rejection are simulated; no anti-malware engine runs
- **Encryption, backup, disaster recovery** — represented as configuration
  and status cards; no such infrastructure exists behind this build
- **Email / SMS delivery** — messages are composed from configurable
  templates and logged, but never transmitted
- **CAPTCHA** — a self-contained checkbox challenge, not a third-party
  service
- **Power BI / external integrations** (dtic IFW, Active Directory, SMS
  gateway, credit bureau, etc.) — the Integration Centre shows the intended
  connection model, health and sync behaviour; nothing is actually contacted
- **Chatbot agent handover** — the "human agent" side of live chat is
  scripted, not a real person
- **Assurance evidence** (ISAE 3402, SOC 2, ISO 27001, penetration test) —
  placeholder entries; real certificates accompany the bid response
- **Implementation plan content** (dates, names, RAID items, team members) —
  illustrative, clearly marked `DEMO / ILLUSTRATIVE`

---

## Architecture

```
src/
  app/            router, navigation config
  components/     shared UI primitives (DataTable, KpiCard, SlaBar, …)
  data/           seed data generators (customers, leads, complaints, …)
  hooks/          SLA calculators, toast bus, render timing
  layouts/        AppShell (internal), PortalShell (customer-facing)
  pages/          one file per route, plus module subfolders
  services/mockApi/  the entire write surface — swap this for a real API later
  store/          Zustand store, persisted to localStorage
  theme/          MUI theme, status colour tokens
  types/          the full domain model (Customer, Lead, Complaint, …)
  utils/          dates, formatting, analytics selectors
tests/            Puppeteer browser verification (dev-time only)
```

Every mutation in the app — creating a complaint, converting a lead,
uploading a document — goes through `src/services/mockApi`. That module is
deliberately shaped like a remote API (async, one method per business
operation) so a real backend could replace its internals without touching
any page component.
