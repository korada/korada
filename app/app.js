define(['angular',
	'controller/blogController',
	'service/blogService',
	,'angular-route'
	,'angular-resource'],function(angular,blogctrl,blogSrv){
	var app= angular.module('app',['ngRoute','ngResource']);
	var path='/app/';
	app.config(['$routeProvider',function($routeProvider){
		$routeProvider.when('/',{
			templateUrl:path+'view/blog.html',
			controller: 'blogController'
		})
	}]);
	app.service('blogService',['$http',blogSrv]);
	app.controller('blogController',['$scope','blogService',blogctrl])
	return app;
});