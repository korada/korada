import React from 'react';
import {Link} from 'react-router-dom';
export default class App extends React.Component {
  render() {
    return (
     <div style={{textAlign: 'center'}}>
        <h1>Hello World Test</h1>
        <h2><Link to="/about">About</Link></h2>
      </div>);
  }
}