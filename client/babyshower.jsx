// Standalone entry for the Seemantham RSVP page.
// Webpack builds this into docs/SravyaBabyShower/index.html (see webpack.config.js),
// so the page served at https://korada.in/SravyaBabyShower is generated entirely
// from the <BabyShower /> React component — no hand-maintained static HTML.
import React from 'react';
import { createRoot } from 'react-dom/client';
import BabyShower from './components/BabyShower';

const root = createRoot(document.getElementById('root'));
root.render(<BabyShower />);
