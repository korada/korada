define([],function(){
	return function($scope,services,$routeParams,$sce){
			services.getById($routeParams.url,function(data){
				$scope.post=data;
			});
			$scope.SkipValidation = function(value) {
  				return $sce.trustAsHtml(htmlDecode(value));
			};

		}

		function htmlDecode(input){
  				var e = document.createElement('div');
  				e.innerHTML = input;
			  	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
		}
});