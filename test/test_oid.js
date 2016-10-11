var db = require('../store/db');

db.raw('insert into test_oid values(1, lo_import(1, \'/usr/src/yasp/replays/78463608_352800291.dem.bz2\'))');

console.log('finish');
