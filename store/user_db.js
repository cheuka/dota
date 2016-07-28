/**
 * Interface to PostgreSQL client
 **/
var config = require('../config');
var pg = require('pg');
pg.types.setTypeParser(20, function(val)
{
  //remember: all values returned from the server are either NULL or a string
  return val === null ? null : parseInt(val, 10);
});
console.error('connecting %s', config.POSTGRES_USER_URL);
var user_db = require('knex')(
{
  client: 'pg',
  connection: config.POSTGRES_USER_URL,
  pool:
  {
    max: 20,
  },
});
/*
user_db.client.pool.on('error', function(err)
{
  throw err;
});
*/
module.exports = user_db;
