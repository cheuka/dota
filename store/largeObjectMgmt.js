// lordstone: the pg large utility functions
var pg_large_man = require('pg-large-object').LargeObjectManager;

function createLargeObject(pg, conString,  inStream, cb)
{
	pg.connect(conString, function(err, client, done)
	{
		if (err)
		{
			console.error('pg connection failed');
			return cb('pg failure');
		}

		var man = new pg_large_man(client); 

		client.query('BEGIN', function(err, result)
		{
			if (err)
			{
				done(err);
				console.error('err in query for lo: ' + err);
				client.emit('error', err);
				return cb(err);
			}
			var buffer_size = 16384;
			man.createAndWritableStream(buffer_size, function(error, oid, stream)
			{
				if (err)
				{
					done(err);
					console.log('Unable to create pg_lo');
					return cb(err);
				}
				console.log('pg_lo: generated oid: ' + oid);
				stream.on('finish', function()
				{
					client.query('COMMIT', function()
					{
						console.log('Finish saving it to oid: ' + oid);
						return cb(null, oid);
					});
				});
				inStream.pipe(stream);
			}); //  end man create
		}); // end client query
	});
}

function readLargeObject(pg, conString, man, outStream, oid, cb)
{
	pg.connect(conString, function(err, client, done)
	{
		if (err)
		{
			console.error('pg connection failed');
			return cb('pg failure');
		}

		var man = new pg_large_man(client); 

		client.query('BEGIN', function(err, result)
		{
			if (err)
			{
				done(err);
				console.error('err in query for lo: ' + err);
				client.emit('error', err);
				return cb(err);
			}
			var buffer_size = 16384;
			man.openAndReadableStream(oid, buffer_size, function(error, lo_size, stream)
			{
				if (err)
				{
					done(err);
					console.log('Unable to read the old: ' + oid);
					return cb(err);
				}
				console.log('pg_lo, size: ' + lo_size);
				stream.on('end', function()
				{
					console.log('Finish reading from oid: ' + oid);
					client.query('COMMIT', cb);
				});
				stream.pipe(outStream);
			}); //  end man create
		}); // end client query
	});
}

module.exports = {
	createLargeObject,
	readLargeObject,
};
