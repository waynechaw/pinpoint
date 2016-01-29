/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';
import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  Navigator
} from 'react-native';

console.log("hello");

import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import reducer from './src/reducers';

//TODO: Make a mapView container 
import MapView from './src/components/mapView';
import Login from './src/containers/login-container';
import Navigation from './src/routes/routes.js';
import socket from './src/socket/socket';

// Apply a thunk middleware which makes an instaneous evaluation delayed (to be called later once something else finishes?)
const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);

//Passing all the combined reducer into the store. If any one of those reducer's data changes, store will be alerted
// and react will re-render all views 
const store = createStoreWithMiddleware(reducer)

// This should actually be called after login
// But we put it here for now for testing
// socket(store);

// store.subscribe(() => {
//   console.log('Username',store.getState());
// });

class Pinpoint extends Component {
  // Provider will pass down the application state to all components that navigation requires.
  render() {
    return (
      <Provider store={store}>
        <Navigation />
      </Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex:1
  }
})


AppRegistry.registerComponent('pinpoint', () => Pinpoint);


















