define([],function(){
	var service=function($http){
		return {
            get: function (response) {
                $http.get('data/site.json').success(function (data) {
                    response(data.posts);
                });
            }
        }
	}
	return service;
});