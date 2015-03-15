define([],function(){
	return function($scope,services){
		services.get(function(data){
			$scope.posts=data;
		});

		$scope.formatUrl=function(url){

		}
	};
});