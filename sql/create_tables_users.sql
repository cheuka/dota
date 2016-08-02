-- lordstone: This is the create file for cheuka's session

CREATE TABLE user_invcode_list (
	invitation_code varchar(30) PRIMARY KEY,
	max_users int not null,
	current_users int not null,
	CONSTRAINT check_max_user 
		CHECK (max_users > 0),
	CONSTRAINT check_current_users 
		CHECK (current_users <= max_users)
);

CREATE TABLE user_list (
	user_id varchar(30) PRIMARY KEY,
	invitation_code varchar(30) 
		REFERENCES user_invcode_list(invitation_code) 
		ON DELETE CASCADE 
		ON UPDATE CASCADE,
	password varchar(30) not null
);

CREATE TABLE user_match_list (
-- need constraint and reference
	user_id varchar(30) 
		REFERENCES user_list(user_id) 
		ON DELETE CASCADE 
		ON UPDATE CASCADE,
	match_id bigint 
		REFERENCES matches(match_id) 
		ON DELETE CASCADE 
		ON UPDATE CASCADE,
	comments varchar(300),
	PRIMARY KEY(user_id, match_id)
);
  
