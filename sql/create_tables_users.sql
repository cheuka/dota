-- lordstone: This is the create file for cheuka's session

CREATE TABLE user_invcode_list (
	invitation_code varchar(30) PRIMARY KEY,
	users json,
	max_users int not null,
	current_users int not null
);

CREATE TABLE user_list (
	user_id varchar(30) PRIMARY KEY,
	invitation_code varchar(30) REFERENCES user_invcode_list(invitation_code) ON DELETE CASCADE,
	password varchar(30) not null,
	matches json
);

CREATE TABLE user_match_list (
-- need constraint and reference
	user_id varchar(30) REFERENCES user_list(user_id) ON DELETE CASCADE,
	match_id bigint REFERENCES matches(match_id) ON DELETE CASCADE,
	comments varchar(300),
	PRIMARY KEY(user_id, match_id)
);
  
