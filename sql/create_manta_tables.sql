-- lordstone: This is to create tables for manta

DROP TABLE IF EXISTS manta;

CREATE TABLE manta (
	user_id varchar(30)
		REFERENCES user_list(user_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	match_id bigint NOT NULL,  -- for now, not linked to the main matches table
	PRIMARY KEY(user_id, match_id),
	replay_blob_key varchar(255),
	content json
);
