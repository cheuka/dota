-- lordstone: This is to create tables for manta

DROP TABLE IF EXISTS manta;

CREATE TABLE manta (
	user_id varchar(30)
		REFERENCES user_list(user_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	dem_index varchar(255) NOT NULL,
	PRIMARY KEY(user_id, dem_index),
	replay_blob_key varchar(255),
	is_public boolean,
	upload_time bigint,
	match_id bigint,  -- for now, not linked to the main matches table
	content json
);
