-- lordstone: This is the create file for cheuka's session

CREATE TABLE my_users (
	user_id varchar(30) PRIMARY KEY,
	invitation_code varchar(30) not null,
	password varchar(30) not null,
	matches json,
	is_logged boolean default false not null
);

CREATE TABLE my_invitation_codes (
	invitation_code varchar(30) PRIMARY KEY,
	users json,
	max_users int not null,
	current_users int not null
);

--CREATE TABLE my_dem_files (
--	match_id bigint PRIMARY KEY,
--	owner_user_id varchar(30),
--	is_public boolean not null
--);


CREATE TABLE my_match_list (
	match_id bigint PRIMARY KEY,
--	owner_id varchar(30) REFERENCES my_users(user_id),
	users_allowed json,
	is_public boolean default false
);
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
   
