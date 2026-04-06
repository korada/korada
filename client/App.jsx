import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Resume from './components/Resume';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Resume />} />
      </Routes>
    </Layout>
  );
}
