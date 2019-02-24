import React from 'react';
import {Link} from 'react-router-dom';
export default class App extends React.Component {
  render() {
    return (
     <div style={{textAlign: 'center'}}>
        <h1>Hello World Test1</h1>
        <h2><Link to="/resume">Resume</Link></h2>
      </div>);
  }
}