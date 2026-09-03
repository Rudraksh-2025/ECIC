import { Box, Typography } from '@mui/material';
import { Faqs } from '../Faqs';

export function PortalFaqs() {
  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.75 }}>Help &amp; frequently asked questions</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
        Search our knowledge base for answers about complaints, applications, products, the portal and privacy.
        The same library answers our chatbot, so you get a consistent answer whichever way you ask.
      </Typography>
      <Faqs portal />
    </Box>
  );
}

export default PortalFaqs;
