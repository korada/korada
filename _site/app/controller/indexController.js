define([],function(){
	return function($scope,service){
		$scope.name='Venkata Aditya Korada';
    service.get(function(data){
      $scope.posts=data;
    });
  };
});
