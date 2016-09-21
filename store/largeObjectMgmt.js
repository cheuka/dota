// lordstone: the pg large utility functions

function createLargeObject(db_client, man, inStream, cb)
{
	db_client.query('BEGIN', function(err, result)
	{
		if (err)
		{
			cb(err);
			console.error('err in query for lo: ' + err);
			db_client.emit('error', err);
		}
		var buffer_size = 16384;
		man.createAndWritableStream(buffer_size, function(error, oid, stream)
		{
			if (err)
			{
				console.log('Unable to create pg_lo');
				return cb(err);
			}
			console.log('pg_lo: generated oid: ' + oid);
			stream.on('finish', function()
			{
				db_client.query('COMMIT', function()
				{
					console.log('Finish saving it to oid: ' + oid);
					return cb(null, oid);
				});
			});
			inStream.pipe(stream);
		}); //  end man create
	}); // end db_client query
}

function readLargeObject(db_client, man, outStream, oid, cb)
{
	db_client.query('BEGIN', function(err, result)
	{
		if (err)
		{
			cb(err);
			console.error('err in query for lo: ' + err);
			db_client.emit('error', err);
		}
		var buffer_size = 16384;
		man.openAndReadableStream(oid, buffer_size, function(error, lo_size, stream)
		{
			if (err)
			{
				console.log('Unable to read the old: ' + oid);
				return cb(err);
			}
			console.log('pg_lo, size: ' + lo_size);
			stream.on('end', function()
			{
				console.log('Finish reading from oid: ' + oid);
				db_client.query('COMMIT', cb);
			});
			stream.pipe(outStream);
		}); //  end man create
	}); // end db_client query

}

module.exports = {
	createLargeObject,
	readLargeObject,
};
