import * as React from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography,
} from '@mui/material';
import { Stack } from '../../components/Stack';
import { CLOSED_LOST_REASONS } from '../../data/opportunities';
import type { ClosedLostReason } from '../../types';

export function ClosedLostDialog({
  open, onClose, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: ClosedLostReason, detail: string) => void | Promise<void>;
}) {
  const [reason, setReason] = React.useState<string>('');
  const [detail, setDetail] = React.useState('');
  const [attempted, setAttempted] = React.useState(false);

  React.useEffect(() => {
    if (open) { setReason(''); setDetail(''); setAttempted(false); }
  }, [open]);

  const reasonError = attempted && !reason ? 'A closed-lost reason is mandatory.' : undefined;
  const detailError = attempted && detail.trim().length < 10
    ? 'Provide supporting detail of at least 10 characters so the loss can be analysed.' : undefined;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Close opportunity as lost</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Alert severity="warning">
            <Typography variant="body2">
              A reason is mandatory when an opportunity is closed lost. The opportunity cannot be saved
              without one, and once closed it becomes read-only for standard users.
            </Typography>
          </Alert>
          <TextField
            select required label="Closed-lost reason" value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={!!reasonError} helperText={reasonError ?? 'Reasons are maintained in the Configuration Centre.'}
            fullWidth
          >
            {CLOSED_LOST_REASONS.map((r) => <MenuItem key={r} value={r as string}>{r}</MenuItem>)}
          </TextField>
          <TextField
            required multiline minRows={3} label="Supporting detail" value={detail}
            onChange={(e) => setDetail(e.target.value)}
            error={!!detailError}
            helperText={detailError ?? 'Feeds the win/loss analysis report and the loss-reason ranking.'}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained" color="error"
          onClick={() => {
            setAttempted(true);
            if (!reason || detail.trim().length < 10) return;
            void onConfirm(reason as ClosedLostReason, detail);
          }}
        >
          Close as lost
        </Button>
      </DialogActions>
    </Dialog>
  );
}
