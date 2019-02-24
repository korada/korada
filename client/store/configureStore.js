import { createHashHistory } from 'history'
import { applyMiddleware, compose, createStore } from 'redux'
import { routerMiddleware } from 'connected-react-router'
import createRootReducer from './reducers'
import thunk from 'redux-thunk';

export const history = createHashHistory();

export default function configureStore(preloadedState) {
  const middleware = [thunk, routerMiddleware(history)];
  const enhancers = [];
    const store = createStore(
      createRootReducer(history), // root reducer with router state
      preloadedState,
      compose(
        applyMiddleware(
          ...middleware // for dispatching history actions
        ), ...enhancers
      ),
    )
  
    return store
  }