select sb.match_id from 
(
	select match_id, hero_id from
	picks_bans
) as sb
group by sb.match_id 
having count(sb.hero_id) = 3
order by count(*)
;

