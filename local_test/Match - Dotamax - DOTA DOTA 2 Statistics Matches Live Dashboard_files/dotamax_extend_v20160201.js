$(function(){
	var navItemBox = $(".nav-head .nav-item-box"),
		navItem = $(".nav-head .nav-item-box .nav-item-list");
	navItemBox.hover(function(){
		navItem.eq($(this).index(".nav-head .nav-item-box")).show();
	},function(){
		navItem.eq($(this).index(".nav-head .nav-item-box")).hide();
	});
});
