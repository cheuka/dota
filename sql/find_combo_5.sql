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
						where exists
			            (
			                select match_id, team_id, is_radiant
			                from team_match tt
            			    where
			                tt.team_id = :team_id
			                and
            			    tt.is_radiant = (
			                    case pb1.team % 2
            			        when 1 then false
			                    when 0 then true
            			        end
			                )
            			    and pb1.match_id = tt.match_id
			                and is_pick = :is_pick
            			)
					)
					as a
					join
					(
						select hero_id as h2, match_id as m2
						from picks_bans pb2
						where exists
			            (
			                select match_id, team_id, is_radiant
			                from team_match tt
			                where
            			    tt.team_id = :team_id
			                and
            			    tt.is_radiant = (
			                    case pb2.team % 2
            			        when 1 then false
			                    when 0 then true
            			        end
			                )
            			    and pb2.match_id = tt.match_id
			                and is_pick = :is_pick
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
					where exists
			        (
		                select match_id, team_id, is_radiant
		                from team_match tt
        		        where
                		tt.team_id = :team_id
		                and
        		        tt.is_radiant = (
		                    case pb3.team % 2
        		            when 1 then false
                		    when 0 then true
		                    end
        		        )
		                and pb3.match_id = tt.match_id
        		        and is_pick = :is_pick
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
				where exists
	            (
    	            select match_id, team_id, is_radiant
        	        from team_match tt
            	    where
                	tt.team_id = :team_id
	                and
    	            tt.is_radiant = (
        	            case pb4.team % 2
            	        when 1 then false
                	    when 0 then true
                    	end
	                )
    	            and pb4.match_id = tt.match_id
        	        and is_pick = :is_pick
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
			where exists
            (
                select match_id, team_id, is_radiant
                from team_match tt
                where
                tt.team_id = :team_id
                and
                tt.is_radiant = (
                    case pb5.team % 2
                    when 1 then false
                    when 0 then true
                    end
                )
                and pb5.match_id = tt.match_id
                and is_pick = :is_pick
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

