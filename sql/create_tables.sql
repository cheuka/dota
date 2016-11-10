CREATE EXTENSION pg_trgm;

CREATE TABLE matches (
  match_id bigint PRIMARY KEY,
  match_seq_num bigint,
  radiant_win boolean,
  start_time bigint,
  duration integer,
  tower_status_radiant integer,
  tower_status_dire integer,
  barracks_status_radiant integer,
  barracks_status_dire integer,
  cluster integer,
  first_blood_time integer,
  lobby_type integer,
  human_players integer,
  leagueid integer,
  positive_votes integer,
  negative_votes integer,
  game_mode integer,
  engine integer,
  picks_bans json,          -- lordstone: modified[],
  --radiant_team_name varchar(255),
  --dire_team_name varchar(255),
  --radiant_captain integer,
  --dire_captain integer,
  --radiant_logo integer
  --dire_logo integer,
  --radiant_team_complete integer,
  --dire_team_complete integer,
  radiant_team_id integer,
  dire_team_id integer,
  pgroup json,
  --parsed data below
  chat json[],
  upload json,
  objectives json[],
  radiant_gold_adv integer[],
  radiant_xp_adv integer[],
  teamfights json[],
  version integer,
  is_manta_parsed boolean
  );

CREATE TABLE player_matches (
  PRIMARY KEY(match_id, player_slot),
  match_id bigint REFERENCES matches(match_id) ON DELETE CASCADE,
  steamid bigint,
  account_id bigint,
  player_slot integer,
  hero_id integer,
  item_0 integer,
  item_1 integer,
  item_2 integer,
  item_3 integer,
  item_4 integer,
  item_5 integer,
  kills integer,
  deaths integer,
  assists integer,
  leaver_status integer,
  gold integer,
  last_hits integer,
  denies integer,
  gold_per_min integer,
  xp_per_min integer,
  gold_spent integer,
  hero_damage integer,
  tower_damage bigint,
  hero_healing bigint,
  level integer,
  --ability_upgrades json[],
  additional_units json[],
  --parsed fields below
  stuns real,
  max_hero_hit json,
  times integer[],
  gold_t integer[],
  lh_t integer[],
  xp_t integer[],
  obs_log json[],
  sen_log json[],
  purchase_log json[],
  kills_log json[],
  buyback_log json[],
  lane_pos json,
  obs json,
  sen json,
  actions json,
  pings json,
  purchase json,
  gold_reasons json,
  xp_reasons json,
  killed json,
  item_uses json,
  ability_uses json,
  hero_hits json,
  damage json,
  damage_taken json,
  damage_inflictor json,
  runes json,
  killed_by json,
  kill_streaks json,
  multi_kills json,
  life_state json,
  --manta result
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
  teamNumber integer,
  iswin boolean,
  player_id bigint, 
  aloneKilledNum integer,
  aloneBeCatchedNum integer,
  aloneBeKilledNum integer,
  consumeDamage integer,
  tf_ratio integer,
  vision_bought integer,
  vision_killed integer,
  runes_total integer,
  purchase_dust integer
  --disabled due to incompatibility
  --kill_streaks_log json[][], --an array of kill streak values
  --multi_kill_id_vals integer[] --an array of multi kill values (the length of each multi kill)
);
--CREATE INDEX on player_matches(account_id) WHERE account_id IS NOT NULL;

CREATE TABLE player_info (
  steamid bigint PRIMARY KEY,
  personaname varchar(255)
);

CREATE TABLE players (
  account_id bigint PRIMARY KEY,
  steamid varchar(32),
  avatar varchar(255),
  avatarmedium varchar(255),
  avatarfull varchar(255),
  profileurl varchar(255),
  personaname varchar(255),
  last_login timestamp with time zone,
  full_history_time timestamp with time zone,
  cheese integer DEFAULT 0,
  fh_unavailable boolean,
  loccountrycode varchar(2)
  /*
    "communityvisibilitystate" : 3,
    "lastlogoff" : 1426020853,
    "loccityid" : 44807,
    "locstatecode" : "16",
    "personastate" : 0,
    "personastateflags" : 0,
    "primaryclanid" : "103582791433775490",
    "profilestate" : 1,
    "realname" : "Alper",
    "timecreated" : 1332289262,
  */
);
CREATE INDEX on players(full_history_time);
CREATE INDEX on players(last_login);
CREATE INDEX on players(cheese);
CREATE INDEX on players USING GIN(personaname gin_trgm_ops);

CREATE TABLE player_ratings (
  PRIMARY KEY(account_id, time),
  account_id bigint,
  match_id bigint,
  solo_competitive_rank integer,
  competitive_rank integer,
  time timestamp with time zone
);

CREATE TABLE subscriptions (
  PRIMARY KEY(customer_id),
  account_id bigint REFERENCES players(account_id) ON DELETE CASCADE,
  customer_id varchar(255),
  amount int,
  active_until date
);
CREATE INDEX on subscriptions(account_id);
CREATE INDEX on subscriptions(customer_id);

CREATE TABLE match_skill (
  match_id bigint PRIMARY KEY,
  skill integer
);

CREATE TABLE notable_players (
  account_id bigint PRIMARY KEY,
  name varchar(255),
  country_code varchar(2),
  fantasy_role int,
  team_id int,
  team_name varchar(255),
  team_tag varchar(255),
  is_locked boolean,
  is_pro boolean,
  locked_until integer
);

CREATE TABLE picks_bans (
  match_id bigint REFERENCES matches(match_id) ON DELETE CASCADE,
  is_pick boolean,
  hero_id int,
  team smallint,
  ord smallint,
  player_id bigint,
  PRIMARY KEY (match_id, ord)
);

-- DROP TABLE IF EXISTS team_match;

CREATE TABLE team_match(
	team_id bigint,
	match_id bigint REFERENCES matches(match_id) ON DELETE CASCADE,
	PRIMARY KEY (team_id, match_id),
	is_radiant boolean not null,
	is_winner boolean not null,
	version varchar(30),
	end_time bigint
);



CREATE TABLE fetch_team_match(
  team_id bigint,
  match_id bigint,
  league_id integer,
  start_time bigint,
  dem_url varchar(150),
  PRIMARY KEY (team_id, match_id),
  is_fetched boolean,
  is_dem_persisted boolean,
  is_manta_parsed boolean
);

CREATE TABLE league_info (
    league_id integer PRIMARY KEY,
    league_name varchar(255),
    league_desc varchar(255),
    league_url varchar(255),
    start_time bigint
);


CREATE TABLE team_position_info(
  team_id bigint,
  position_id integer,
  PRIMARY KEY (team_id, position_id),
  account_id bigint,
  steamid bigint
);

CREATE OR REPLACE FUNCTION cacuclate_kills(json[]) RETURNS integer AS $$
 DECLARE
       index integer := 1;
       time integer := 0;
       length2 integer := array_length($1, 1);
    BEGIN
       while index <= length2 LOOP
			 IF ($1[index]->>'time')::int < 600 THEN
        time := time + 1;
       END IF;

       index := index + 1;
			 END LOOP;
			 RETURN time;
    END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cacuclate_enmy_gold(value INTEGER, match_ids BIGINT, account_ids BIGINT, indexs INTEGER) RETURNS integer AS $$
    DECLARE
       enemy_account BIGINT := 0;
       enemy RECORD;
       results INTEGER := 0;
	   player_position INTEGER :=0;
    BEGIN
      SELECT position_id INTO player_position from team_position_info WHERE team_position_info.account_id=account_ids;
      IF player_position in (1,2,3) THEN
        SELECT gold_t[7] as gold, lh_t[7] as lh, xp_t[7] as xp INTO enemy FROM player_matches WHERE player_matches.match_id=match_ids AND player_matches.account_id <> account_ids AND player_matches.account_id IN (SELECT account_id from team_position_info WHERE team_position_info.position_id=player_position);


		IF indexs=1 THEN
		  results := value - enemy.gold;
		ELSIF indexs=2  THEN
		  results := value - enemy.lh;
		ELSIF indexs=3 THEN
		  results := value - enemy.xp;
		ELSE
		  results :=0;
		END IF;
	  ELSE
	  END IF;



	  RETURN results;
    END;
$$ LANGUAGE plpgsql;

