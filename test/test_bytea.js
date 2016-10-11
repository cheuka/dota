var db = require('../store/db');
var queries = require('../store/queries');
var stream = require('stream');

var fs = require('fs');

var readstream = fs.createReadStream('./replays/78463608_352800491.dem.bz2');

var bytea = '';
readstream.on('data', function handleStream(e)
{
bytea += escape(e);
});

readstream.on('end', function()
{
fs.writeFileSync('./replays/test.dem', bytea, 'utf8');
console.log('finish');
});


