define(['posts'],function(posts){
	var service=function($http){
		return {
            get: function (response) {
                response(posts);
            },
            getById: function(id,response){
            	var i=posts.length;
            	var obj;
            	while(i--){
            		if(posts[i].url.indexOf(id)>-1){
            			obj=posts[i];
            			break;
            		}
            	}
            	response(obj);
            }
        }
	}
	return service;
});