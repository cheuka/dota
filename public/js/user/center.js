// This is the js file for center page
window.onload = function loadMatches()
{
	// This is to request for match details given the match_id the
	// user has uploaded or requested

	function poll(results){
		$.post(
		{
			url: "/api/brief_match",
			data: {
				bp: true,
				overview: true
			},
			method: 'POST'		
		}).done(function(results)
		{
			console.log(results);
		};

	}
	
}


