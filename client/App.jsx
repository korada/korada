import React from 'react';
import { Route } from 'react-router';
import Layout from './components/Layout';
import Resume from './components/Resume';

export default () => (
  <Layout>
    <Route exact path='/' component={Resume} />
  </Layout>
);