var Sequelize = require('sequelize');
var sequelize = new Sequelize(process.env.ENV_DB || 'pinpointdb', 'postgres', '', { dialect: 'postgres', logging: false });



var Visits = sequelize.define('Visits', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  latitude: { type: Sequelize.FLOAT, unique: false, notNull: true },
  longitude: { type: Sequelize.FLOAT, unique: false, notNull: true },
  startTime: { type: Sequelize.DATE, unique: false, notNull: true },
  endTime: { type: Sequelize.DATE, unique: false, notNull: true },
  address: { type: Sequelize.STRING, unique: false, notNull: true }
}, { timestamps: false });

var Users = sequelize.define('Users', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true }
}, { timestamps: false });

var Tags = sequelize.define('Tags', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING, notNull: true }
}, { timestamps: false });

var tags_users = sequelize.define('tags_users', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  tag_id: { type: Sequelize.INTEGER, notNull: true},
  user_id: { type: Sequelize.INTEGER, notNull: true}
}, { timestamps: false });

var tags_visits = sequelize.define('tags_visits', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  tag_id: { type: Sequelize.INTEGER, notNull: true},
  visit_id: { type: Sequelize.INTEGER, notNull: true}
}, { timestamps: false });


var init = function() {

  Tags.belongsToMany(Users, { through: 'tags_users', foreignKey: 'tag_id' });
  Users.belongsToMany(Tags, { through: 'tags_users', foreignKey: 'user_id' });

  Tags.belongsToMany(Visits, { through: 'tags_visits', foreignKey: 'tag_id' });
  Visits.belongsToMany(Tags, { through: 'tags_visits', foreignKey: 'visit_id' });

  sequelize.sync();
};



module.exports = {
  init: init
};