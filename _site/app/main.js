require.config({
	paths:{
	'angular':'../js/angular',
	'angular-route':'../js/angular-route.min',
	'angular-resource':'../js/angular-resource.min',
	'posts':'data/posts'
	},
	shim:{
		angular:{
			exports:'angular'
		},
		'angular-route':{
			deps:['angular'],
			exports:'angular'
		},
		'angular-resource':{
			deps:['angular'],
			exports:'angular'
		}
	}
});

require(['angular','app'],function(angular){
	angular.bootstrap(document,['app']);
});