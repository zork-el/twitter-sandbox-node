const mongoose = require('mongoose')
const Schema = mongoose.Schema;

var twitterSchema = new Schema({
  screen_name: {
    type: String,
    required: true
  },
  followers: {
    type: Array,
    default: []
  }
});

var Users = mongoose.model('User', twitterSchema);

module.exports = Users;