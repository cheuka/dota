select
d.h1, d.h2,  count(*) from
(
	select h1, h2, m1 from (	
		select distinct h1, h2, m1 from
		(
			select hero_id as h1, match_id as m1 from picks_bans pb1
		)
		as a
		join
		(
			select hero_id as h2, match_id as m2 from picks_bans pb2
		)
		as b
		on 
		a.m1 = b.m2
		and 
		a.h1 <> b.h2
	)
	as c
	where not ( h1 < h2)
) 
as d
group by (d.h1, d.h2)
order by count(*)
desc
-- limit 10
;

