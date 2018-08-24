angular.module('starter', ['ionic', 'starter.controllers', 'starter.routes', 'starter.services', 'starter.directives', 'ngCordova', 'ngResource', 'angular-md5', 'pascalprecht.translate'])
	.run(function ($rootScope, $ionicPlatform, $ionicLoading, $location, $ionicHistory,$state, $cordovaSplashscreen, $cordovaToast, User, Storage, System, Jpush) {
		$ionicPlatform.ready(function () {
			if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
				cordova.plugins.Keyboard.disableScroll(true);
			}
			if (window.StatusBar) {
				StatusBar.backgroundColorByHexString("#ff7300");
				StatusBar.styleLightContent();
				// StatusBar.styleDefault();
			}
		});
		document.addEventListener("deviceready", onDeviceReady, false);
		function onDeviceReady() {
			if(device.platform == 'Android'){
				$rootScope.platform = 'version';
				$rootScope.downloadUrl = 'downloadUrl';
			}else if(device.platform == 'iOS'){
				$rootScope.platform = 'versionIos';
				$rootScope.downloadUrl = 'downloadIosUrl';
			}
		}
		document.addEventListener("deviceready", function () {
			if (window.StatusBar) {
				StatusBar.backgroundColorByHexString("#ff7300");
				StatusBar.styleLightContent();
				// StatusBar.styleDefault();
			}
			//退出启动画面
			setTimeout(function () {
				try {
					$cordovaSplashscreen.hide();
				} catch (e) {
					console.info(e);
				}
			}, 700);
			Jpush.init();// 极光推送
			System.checkUpdate();//检查更新
		}, false);

		//退出
		var exit = false;
		$ionicPlatform.registerBackButtonAction(function (e) {
			e.preventDefault();
			if ($location.path() == '/tab/home' || $location.path() == '/tab/index' || $location.path() == '/auth/login' || $location.path() == '/tab/my') {
				if (exit) {
					ionic.Platform.exitApp();
				} else {
					exit = true;
					$cordovaToast.showShortCenter('再按一次退出系统', "500");
					setTimeout(function () {
						exit = false;
					}, 2000);
				}
			} else if($location.path() == '/auth/login'){
					$state.go('tab.home');
			}
			else if ($ionicHistory.backView()) {
				$ionicHistory.goBack();
			} else {
				exit = true;
				$cordovaToast.showShortCenter('再按一次退出系统', "500");
				setTimeout(function () {
					exit = false;
				}, 2000);
			}
			e.preventDefault();
			return false;
		}, 101);

		$rootScope.$on('$stateChangeStart', function (event, toState) {
			var noNeedLogin = ['auth.login', 'auth.register', 'auth.resetPsd','oneLogin','tab.home','tab.category','tab.cart', 'tab.index','tab.my', 'mall.shop', 'mall.list','mall.goods','mall.search','offline.shopList','offline.shopInfo','offline.newsList','offline.newsInfo'];
			if (noNeedLogin.indexOf(toState.name) < 0 && !User.checkAuth()) {
				event.preventDefault(); //阻止默认事件，即原本页面的加载
				$state.go('auth.login')
			}
		});

		$rootScope.globalInfo = {
			data: Storage.get('user'), //全局user的数据
			lngLat: {
				lng: '',
				lat: ''
			}
		};
		// console.log($rootScope.globalInfo.data);
		$rootScope.href = '';
	})

	.constant('ENV', {
		'REGULAR_MOBILE': /^1\d{10}$/,
		'REGULAR_PASSWORD': /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,16}$/,
		'API_URL': 'http://192.168.1.86:8100/api/dapp/146/api.dhc',
		'YD_URL': 'http://192.168.1.86:8100/api/service/146/api.dhc',
		// 'API_URL': 'http://develop.dh-tech.cn/dapp/146/api.dhc',
		// 'YD_URL': 'http://develop.dh-tech.cn/service/146/api.dhc',
		'default_avatar': 'img/nav.png'
	})

	.config(function ($ionicConfigProvider) {
		$ionicConfigProvider.platform.ios.tabs.style('standard');
		$ionicConfigProvider.platform.ios.tabs.position('bottom');
		$ionicConfigProvider.platform.android.tabs.style('standard');
		$ionicConfigProvider.platform.android.tabs.position('bottom');
		$ionicConfigProvider.platform.ios.navBar.alignTitle('center');
		$ionicConfigProvider.platform.android.navBar.alignTitle('center');
		$ionicConfigProvider.platform.ios.backButton.previousTitleText('').icon('ion-ios-arrow-thin-left');
		$ionicConfigProvider.platform.android.backButton.previousTitleText('').icon('ion-android-arrow-back');
		$ionicConfigProvider.platform.ios.views.transition('ios');
		$ionicConfigProvider.platform.android.views.transition('android');
	})
	.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider, $translateProvider) {
		$httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
		$httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
		var param = function (obj) {
			var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
			for (name in obj) {
				value = obj[name];
				if (value instanceof Array) {
					for (i = 0; i < value.length; ++i) {
						subValue = value[i];
						fullSubName = name + '[' + i + ']';
						innerObj = {};
						innerObj[fullSubName] = subValue;
						query += param(innerObj) + '&';
					}
				}
				else if (value instanceof Object) {
					for (subName in value) {
						subValue = value[subName];
						fullSubName = name + '[' + subName + ']';
						innerObj = {};
						innerObj[fullSubName] = subValue;
						query += param(innerObj) + '&';
					}
				}
				else if (value !== undefined && value !== null)
					query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
			}
			return query.length ? query.substr(0, query.length - 1) : query;
		};
		$httpProvider.defaults.transformRequest = [function (data) {
			return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
		}];
		/*$httpProvider.defaults.headers.post['X-CSRFToken'] = 11;*/
		$httpProvider.interceptors.push('TokenAuth');
		$translateProvider.useStaticFilesLoader({
				files: [{
					prefix: './languages/',
					suffix: '.json'
				}]
			});
			var lang = window.localStorage.lang||'cn';
			// $translateProvider.determinePreferredLanguage();

			//首选语言
			$translateProvider.preferredLanguage(lang);
			// $translateProvider.fallbackLanguage('enUS');
	})

	.filter("T", ['$translate', function($translate) {
	    return function(key) {
	        if(key){
	            return $translate.instant(key);
	        }
	    };
	}]);

