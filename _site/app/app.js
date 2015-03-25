define(['angular',
	'controller/blogController',
	'controller/postController',
	'controller/indexController',
	'service/blogService',
	,'angular-route'
	,'angular-resource'
	,'angular-sanitize'],function(angular,blogctrl,postctrl,indexCtrl,blogSrv){
	var app= angular.module('app',['ngRoute','ngResource','ngSanitize']);
	var path='/app/';
	app.config(['$routeProvider','$locationProvider',function($routeProvider,$locationProvider){
		$routeProvider.when('/',{
				templateUrl:path+'view/index.html',
				controller:'indexController'
			})
		.when('/blog',{
			templateUrl:path+'view/blog.html',
			controller: 'blogController'
		})
		.when('/blog/post/:url',{
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
	app.controller('indexController',['$scope',indexCtrl]);
	return app;
});