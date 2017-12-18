import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App.jsx'
import About from './components/About.jsx'
import { BrowserRouter as Router,Switch, Route, hashHistory, DefaultRoute } from 'react-router-dom'

ReactDOM.render((
  <Router >
  <Switch>
    <Route exact path='/' component={App} />
    <Route path='/about' component={About}/>
    </Switch>
  </Router>
  ), document.getElementById('root'))
