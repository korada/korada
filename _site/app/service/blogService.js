define(['posts'],function(posts){
	var service=function($http){
		return {
            get: function (response) {
                response(posts);
            }
        }
	}
	return service;
});