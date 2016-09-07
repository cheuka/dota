DROP TABLE IF EXISTS dem_storage;

CREATE TABLE dem_storage(
	user_id varchar(30) 
		REFERENCES user_list(user_id) 
		ON DELETE CASCADE,
	dem_index varchar(255) NOT NULL,
	PRIMARY KEY(user_id, dem_index),
	content bytea,  -- may be nicer to use BLOB, but ...
	is_public bool NOT NULL DEFAULT TRUE,
	upload_time timestamp NOT NULL,
	file_name varchar(255)
);
	
	
