import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { Link as RouterLink, useRouteError } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { Stack } from '../components/Stack';

export function RouteError({ notFound }: { notFound?: boolean }) {
  const error = useRouteError() as Error | undefined;
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh', p: 3 }}>
      <Card sx={{ maxWidth: 620, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <ErrorOutlineIcon sx={{ fontSize: 46, color: 'warning.main', mb: 1.5 }} />
          <Typography variant="h3" sx={{ mb: 1 }}>
            {notFound ? 'Screen not found' : 'Something went wrong on this screen'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {notFound
              ? 'The address you followed does not correspond to a screen in this demonstration build. Use the navigation to continue.'
              : 'The demonstration recovered from an unexpected error. No data was lost — the environment is held in your browser and can be reset from the profile menu.'}
          </Typography>
          {error?.message && !notFound && (
            <Box sx={{
              bgcolor: 'surface.sunken', p: 1.5, borderRadius: 2, mb: 3,
              fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textAlign: 'left',
              wordBreak: 'break-word',
            }}>
              {error.message}
            </Box>
          )}
          <Stack direction="row" gap={1.5} justifyContent="center">
            <Button variant="contained" component={RouterLink} to="/dashboard">
              Return to dashboard
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Reload screen
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default RouteError;
