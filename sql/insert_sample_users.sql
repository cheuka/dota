INSERT INTO my_users VALUES
(
	'sample_user',
	'12he128eh9qw8e',
	'mypassword'
),
(
	'cheuka',
	'11212812e12qwee',
	'default'
),
(
	'sniper2016',
	'asdqwsdvqwe312wq',
	'biubiubiu'
),
(
	'jijihenda',
	'11eewf0iqweuqwe1',
	'woshisb'
);

INSERT INTO my_invitation_codes VALUES
(
	'12he128eh9qw8e',
	'{"users": ["sample_user"]}'::json,
	1,
	1
),
(
	'11212812e12qwee',
	'{"users": ["cheuka"]}'::json,
	1,
	1
),
(
	'asdqwsdvqwe312wq',
	'{"users": ["sniper2016"]}'::json,
	1,
	1
),
(
	'11eewf0iqweuqwe1',
	'{"users": ["jijihenda"]}'::json,
	1,
	1
);
