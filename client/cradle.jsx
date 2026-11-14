// Standalone entry for Anagha Saraswika's Barasala RSVP page.
// Webpack builds this into docs/AnaghaBarasala/index.html (see webpack.config.js).
import React from 'react';
import { createRoot } from 'react-dom/client';
import CradleCeremony from './components/CradleCeremony';

const root = createRoot(document.getElementById('root'));
root.render(<CradleCeremony />);
