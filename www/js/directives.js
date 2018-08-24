angular.module('starter.directives', [])

	.directive('hideTabs', function($rootScope) {
		return {
			restrict: 'A',
			link: function($scope, $el) {
				$rootScope.hideTabs = true;
				$scope.$on('$destroy', function() {
					$rootScope.hideTabs = false;
				});
			}
		};
	})

	.directive('errSrc', function () {
		return {
			link: function (scope, element, attrs) {
				element.bind('error', function () {
					if (attrs.src != attrs.errSrc) {
						attrs.$set('src', attrs.errSrc);
					}
				});
			}
		}
	})

	.directive('ngEnter', function() {
		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if (event.which === 13) {
					scope.$apply(function () {
						scope.$eval(attrs.ngEnter, {'event': event});
					});

					event.preventDefault();
				}
			});
		}
	})


	.directive('btnBack', function($ionicHistory, $state) {
		return{
			link: function(scope, elem, attrs) {
				$(elem).click(function () {
					if ($(this).next().hasClass('sub-menu') === false) {
						$ionicHistory.goBack();
					}else{
						$state.go('tab.my');
					}
				});
			}
		}
	})

	.filter('minNum', function () {
		return function (str, num) {
			num = num || 0;
			if(isNaN(str)){
				str = parseInt(str);
			}
			if(parseInt(str) < num){
				str = num;
			}
			return str;
		}
	})
	// 动态设置ion-scroll的高度
	.directive('scrollHeight',function($window){
		return{
			restrict:'AE',
			link:function(scope,element){
				element[0].style.height=($window.innerHeight-44-40-45)+'px';
			}
		}
	})
	//价格过滤器
	.filter('priceReset', function () {
		return function (str) {
			// console.log(str); //数字不是string类型的转换一下
			if(typeof str!="string"){
				var indexNum=String(str).indexOf(",");
				if(indexNum>=0){
					var tempArr=str.split(",");
					var tempStr='';
					for(var i=0;i<tempArr.length;i++){
						tempStr+=tempArr[i];
					}
					str=tempStr*1;
				};
			}
			if(str >=10000){
				str=str/10000;
				return str+"万";
			}else{
				return str;
			}

		}
	});

