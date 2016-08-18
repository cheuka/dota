
select d.h1, d.h2, count(*),
sum(
	case is_winner 
	when 't' then 1
	when 'f' then 0
	end
) as wins 
from
(
	select h1, h2, m1, is_winner from (	
		select distinct h1, h2, m1 from
		(
			select hero_id as h1, 
			match_id as m1
			from picks_bans pb1
			where is_pick = :is_pick 
			and match_id in -- :temp_table:
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
			select hero_id as h2, 
			match_id as m2
			from picks_bans pb2
			where is_pick = :is_pick 
			and match_id in -- :temp_table:
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
		a.m1 = b.m2
		and 
		a.h1 > b.h2
		-- where not (a.h1 < b.h2)
	)
	as c
	left join team_match t on m1 = t.match_id
	where t.team_id = :team_id
) 
as d
group by (d.h1, d.h2)
order by count(*)
desc
limit :limit
;

