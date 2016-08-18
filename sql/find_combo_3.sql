select h1, h2, h3, count(*),
sum(
	case is_winner
	when 't' then 1
	when 'f' then 0
	end
) as wins
from
(
	select h1, h2, h3, m1, is_winner from
	(
		select h1, h2, h3, m1 from (	
			select distinct h1, h2, m1 from
			(
				select hero_id as h1, match_id as m1 
				from picks_bans pb1
				where is_pick = :is_pick
				and match_id in
				(
					select match_id from team_match
	                where team_id = :team_id
				)
	            and (team % 2) in
    	        (
        	        select (case is_radiant
            	            when 't' then  0
                	        when 'f' then  1
                    	    end) as res
	                from team_match tt
    	            where match_id = match_id
        	        and team_id = :team_id
            	)

			)
			as a
			join
			(
				select hero_id as h2, match_id as m2
				from picks_bans pb2
				where is_pick = :is_pick
				and match_id in
				(
					select match_id from team_match
	                where team_id = :team_id
				)
	            and (team % 2) in
    	        (
        	        select (case is_radiant
            	            when 't' then  0
                	        when 'f' then  1
                    	    end) as res
	                from team_match tt
    	            where match_id = match_id
        	        and team_id = :team_id
            	)

			)
			as b
			on 
			a.m1 = b.m2	and 
			a.h1 > b.h2
			-- where not (a.h1 < b.h2)
		)
		as c
		join
		(	
			select hero_id as h3, match_id as m3
			from picks_bans pb3
			where is_pick = :is_pick
			and match_id in
			(
				select match_id from team_match
                where team_id = :team_id
			)

            and (team % 2) in
            (
                select (case is_radiant
                        when 't' then  0
                        when 'f' then  1
                        end) as res
                from team_match tt
                where match_id = match_id
                and team_id = :team_id
            )

		)
		as d
		on
		c.m1 = d.m3 
		-- and	c.h1 <> d.h3 
		and 
		c.h2 > d.h3
		-- where not (h1 < h2)		
	)	
	as e
	left join team_match t on m1 = t.match_id
	where -- not (h2 < h3) and 
	t.team_id = :team_id
) 
as f
group by (f.h1, f.h2, f.h3)
order by count(*)
desc
limit :limit
;

