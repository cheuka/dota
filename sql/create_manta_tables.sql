-- lordstone: This is to create tables for manta

DROP TABLE IF EXISTS manta;

CREATE TABLE manta (
	user_id varchar(30)
		REFERENCES user_list(user_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	match_id bigint NOT NULL,
	steamid bigint NOT NULL,
	PRIMARY KEY(user_id, match_id, steamid),
	dem_index varchar(255),
	replay_blob_key varchar(255),
	is_public boolean,
	upload_time bigint,
	-- player_match contents
	player_name varchar(255),
	hero_id integer,
	hero_name varchar(255),
	create_total_damages integer,
	create_deadly_damages integer,
	create_total_stiff_control integer,
	create_deadly_stiff_control real,
	opponent_hero_deaths integer,
	create_deadly_damages_per_death real,
	create_deadly_stiff_control_per_death real,
	rGpm integer,
	unrRpm integer,
	killHeroGold integer,
	deadLoseGold integer,
	fedEnemyGold integer,
	teamNumber bigint,
	isWin boolean,
	player_id bigint,	
	aloneKilledNum integer,
	aloneBeCatchedNum integer,
	aloneBeKilledNum integer,
	consumeDamage integer,
	healing integer,
	vision_bought integer,
	vision_kill integer,
	apm integer,
	runes integer
);
