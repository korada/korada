import styles from '../css/site.css'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/app.jsx'
import Resume from './components/resume.jsx'
import { BrowserRouter as Router,Switch, Route, hashHistory, DefaultRoute } from 'react-router-dom'

ReactDOM.render((
  <Router basename={process.env.PUBLIC_URL}>
  <Switch>
    <Route exact path='/' component={App} />
    <Route path='/resume' component={Resume}/>
    </Switch>
  </Router>
  ), document.getElementById('root'))
