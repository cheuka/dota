select h1, h2, h3, count(*) from
(
	select h1, h2, h3, m1 from
	(
		select h1, h2, h3, m1 from (	
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
			a.m1 = b.m2	and 
			a.h1 <> b.h2	
		)
		as c
		join
		(
			select hero_id as h3, match_id as m3 from picks_bans pb3
		)
		as d
		on
		c.m1 = d.m3 and
		c.h1 <> d.h3 and c.h2 <> d.h3
		where not (h1 < h2)		
	)	
	as e
	where not (h2 < h3)
) 
as f
group by (f.h1, f.h2, f.h3)
order by count(*)
desc
-- limit 100
;

