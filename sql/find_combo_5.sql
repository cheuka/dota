select h1, h2, h3, h4, h5, count(*),
sum(
	case is_winner
	when 't' then 1
	when 'f' then 0
	end
) as wins
from 
(
	select h1, h2, h3, h4, h5, m1, is_winner from
	(
		select h1, h2, h3, h4, h5, m1 from 
		(
			select h1, h2, h3, h4, m1 from
			(
				select h1, h2, h3, m1 from
				(
					select h1, h2, m1 from
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
					a.m1 = b.m2 and
					a.h1 > b.h2
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
				and
				c.h2 > d.h3
			)
			as e
			join
			(
				select hero_id as h4, match_id as m4
				from picks_bans pb4
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
			as f
			on e.m1 = f.m4
			and
			e.h3 > f.h4
		)
		as g
		join
		(	
			select hero_id as h5, match_id as m5
			from picks_bans pb5
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
		as h
		on g.m1 = h.m5
		and
		g.h4 > h.h5
	)
	as i
	left join team_match t on m1 = t.match_id
	where t.team_id = :team_id
)
as j
group by (j.h1, j.h2, j.h3, j.h4, j.h5)
order by count(*)
desc
limit :limit
;

