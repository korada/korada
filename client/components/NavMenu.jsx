import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Glyphicon, Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import '../assets/css/NavMenu.scss';

export default props => (
  <div className="row">

    <div className="ribbon">
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav" id="navbarnav">
            <li className="nav-item">
              <NavLink to="/" activeClassName="link-active">
                Resume
          </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </div>

  </div>
);
