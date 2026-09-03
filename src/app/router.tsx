import * as React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AppShell } from '../layouts/AppShell';
import { PortalShell } from '../layouts/PortalShell';
import { RouteError } from '../pages/RouteError';

const lazy = (loader: () => Promise<{ default: React.ComponentType }>) => {
  const C = React.lazy(loader);
  return (
    <React.Suspense fallback={<ScreenLoader />}>
      <C />
    </React.Suspense>
  );
};

function ScreenLoader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 320, gap: 1.5 }}>
      <CircularProgress size={26} />
      <Typography variant="body2" color="text.secondary">Loading module…</Typography>
    </Box>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: lazy(() => import('../pages/Login')) },
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { path: 'dashboard', element: lazy(() => import('../pages/Dashboard')) },
      { path: 'my-work', element: lazy(() => import('../pages/MyWork')) },
      { path: 'leads', element: lazy(() => import('../pages/Leads')) },
      { path: 'leads/new', element: lazy(() => import('../pages/LeadNew')) },
      { path: 'leads/:id', element: lazy(() => import('../pages/LeadDetail')) },
      { path: 'opportunities', element: lazy(() => import('../pages/Opportunities')) },
      { path: 'opportunities/:id', element: lazy(() => import('../pages/OpportunityDetail')) },
      { path: 'complaints', element: lazy(() => import('../pages/Complaints')) },
      { path: 'complaints/new', element: lazy(() => import('../pages/ComplaintNew')) },
      { path: 'complaints/:id', element: lazy(() => import('../pages/ComplaintDetail')) },
      { path: 'customers', element: lazy(() => import('../pages/Customers')) },
      { path: 'customers/:id', element: lazy(() => import('../pages/CustomerDetail')) },
      { path: 'applications', element: lazy(() => import('../pages/Applications')) },
      { path: 'applications/new', element: lazy(() => import('../pages/ApplicationNew')) },
      { path: 'applications/:id', element: lazy(() => import('../pages/ApplicationDetail')) },
      { path: 'documents', element: lazy(() => import('../pages/Documents')) },
      { path: 'pipeline', element: lazy(() => import('../pages/Pipeline')) },
      { path: 'campaigns', element: lazy(() => import('../pages/Campaigns')) },
      { path: 'campaigns/:id', element: lazy(() => import('../pages/CampaignDetail')) },
      { path: 'events', element: lazy(() => import('../pages/Events')) },
      { path: 'events/:id', element: lazy(() => import('../pages/EventDetail')) },
      { path: 'qr-capture', element: lazy(() => import('../pages/QrCapture')) },
      { path: 'campaign-performance', element: lazy(() => import('../pages/CampaignPerformance')) },
      { path: 'cim', element: lazy(() => import('../pages/Cim')) },
      { path: 'reports', element: lazy(() => import('../pages/Reports')) },
      { path: 'reports/:id', element: lazy(() => import('../pages/ReportDetail')) },
      { path: 'analytics', element: lazy(() => import('../pages/Analytics')) },
      { path: 'tasks', element: lazy(() => import('../pages/Tasks')) },
      { path: 'notifications', element: lazy(() => import('../pages/Notifications')) },
      { path: 'chat', element: lazy(() => import('../pages/Chat')) },
      { path: 'faqs', element: lazy(() => import('../pages/Faqs')) },
      { path: 'audit', element: lazy(() => import('../pages/AuditLog')) },
      { path: 'security', element: lazy(() => import('../pages/SecurityCenter')) },
      { path: 'users', element: lazy(() => import('../pages/UsersRoles')) },
      { path: 'configuration', element: lazy(() => import('../pages/Configuration')) },
      { path: 'integrations', element: lazy(() => import('../pages/Integrations')) },
      { path: 'implementation', element: lazy(() => import('../pages/Implementation')) },
      { path: 'bid-demo', element: lazy(() => import('../pages/BidDemo')) },
      { path: 'coverage', element: lazy(() => import('../pages/Coverage')) },
    ],
  },
  {
    path: '/portal',
    element: <PortalShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: lazy(() => import('../pages/portal/PortalHome')) },
      { path: 'cases', element: lazy(() => import('../pages/portal/PortalCases')) },
      { path: 'cases/new', element: lazy(() => import('../pages/portal/PortalNewComplaint')) },
      { path: 'enquiries', element: lazy(() => import('../pages/portal/PortalEnquiries')) },
      { path: 'enquiries/new', element: lazy(() => import('../pages/portal/PortalNewEnquiry')) },
      { path: 'applications', element: lazy(() => import('../pages/portal/PortalApplications')) },
      { path: 'documents', element: lazy(() => import('../pages/portal/PortalDocuments')) },
      { path: 'faqs', element: lazy(() => import('../pages/portal/PortalFaqs')) },
      { path: 'chat', element: lazy(() => import('../pages/portal/PortalChat')) },
      { path: 'profile', element: lazy(() => import('../pages/portal/PortalProfile')) },
    ],
  },
  { path: '*', element: <RouteError notFound /> },
]);
