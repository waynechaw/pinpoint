import { Component } from 'react-native';
import { connect } from 'react-redux';
import Stats from '../components/stats.js';
import hideStats from '../actions/action_hide_stats';

// Makes user state available to component
function mapStateToProps({ user, poi, settings, statsVisibility, tag }) {
  return { user, poi, settings, statsVisibility, tag };
}

export default connect(mapStateToProps, { hideStats })(Stats);