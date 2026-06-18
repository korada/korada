import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Resume from './components/Resume';
import BabyShower from './components/BabyShower';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Resume />} />
        <Route path="/SravyaBabyShower" element={<BabyShower />} />
      </Routes>
    </Layout>
  );
}
