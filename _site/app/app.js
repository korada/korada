define(['angular',
	'controller/blogController',
	'controller/postController',
	'service/blogService',
	,'angular-route'
	,'angular-resource'
	,'angular-sanitize'],function(angular,blogctrl,postctrl,blogSrv){
	var app= angular.module('app',['ngRoute','ngResource','ngSanitize']);
	var path='/app/';
	app.config(['$routeProvider',function($routeProvider){
		$routeProvider.when('/',{
			templateUrl:path+'view/blog.html',
			controller: 'blogController'
		})
		.when('/post/:url',{
			templateUrl:path+'view/post.html',
			controller:'postController'
		})
		.otherwise({
        redirectTo: '/'
      });
	}]);
	app.service('blogService',['$http',blogSrv]);
	app.controller('blogController',['$scope','blogService',blogctrl]);
	app.controller('postController',['$scope','blogService','$routeParams','$sce',postctrl]);
	return app;
});