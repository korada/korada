import React from 'react';
import NavMenu from './NavMenu';

export default function Layout({ children }) {
  return (
    <div className="site-root">
      <NavMenu />
      {children}
    </div>
  );
}
