angular.module('starter.routes', [])
	.config(function ($stateProvider, $urlRouterProvider) {
		// Ionic uses AngularUI Router which uses the concept of states
		// Learn more here: https://github.com/angular-ui/ui-router
		// Set up the various states which the app can be in.
		// Each state's controller can be found in controllers.js
		$stateProvider
		// setup an abstract state for the tabs directive
			.state('tab', {
				url: '/tab',
				abstract: true,
				templateUrl: 'templates/tabs.html'
			})

			.state('tab.home', {
				url: '/home',
				views: {
					'tab-home': {
						templateUrl: 'templates/home/tab-home.html',
						controller: 'HomeCtrl'
					}
				}
			})
			.state('tab.index', {
				url: '/index',
				views: {
					'tab-index': {
						templateUrl: 'templates/home/tab-index.html',
						controller: 'IndexCtrl'
					}
				}
			})

			.state('tab.category', {
				url: '/category',
				// cache: false,
				views: {
					'tab-category': {
						templateUrl: 'templates/home/tab-category.html',
						controller: 'CategoryCtrl'
					}
				}
			})

			.state('tab.order', {
				url: '/order/:status',
				params: {'status': null},
				cache: false,
				views: {
					'tab-order': {
						templateUrl: 'templates/home/tab-order.html',
						controller: 'tabOrderCtrl'
					}
				}
			})

			.state('tab.cart', {
				url: '/cart',
				cache: false,
				views: {
					'tab-cart': {
						templateUrl: 'templates/home/tab-cart.html',
						controller: 'CartCtrl'
					}
				}
			})

			.state('tab.my', {
				url: '/my',
				cache: false,
				views: {
					'tab-my': {
						templateUrl: 'templates/home/tab-my.html',
						controller: 'MyCtrl'
					}
				}
			})

			.state('auth', {
				url: '/auth',
				abstract: true,
				templateUrl: 'templates/auth/layout.html'
			})

			.state('auth.oneLogin', {
				url: '/oneLogin',
				views: {
					'content': {
						templateUrl: 'templates/auth/oneLogin.html',
						controller: 'oneLoginCtrl'
					}
				}
			})

			.state('auth.login', {
				url: '/login',
				params: {'forward': null},
				views: {
					'content': {
						templateUrl: 'templates/auth/login.html',
						controller: 'LoginCtrl'
					}
				}
			})

			.state("auth.register", {
				url: "/register",
				// cache: false,
				views: {
					'content': {
						templateUrl: 'templates/auth/register.html',
						controller: 'RegisterCtrl'
					}
				}
			})

			.state('auth.languages', {
				url: '/languages/:type',
				// cache: false,
				views: {
					'content': {
						templateUrl: 'templates/auth/languages.html',
						controller: 'LanguagesCtrl'
					}
				}
			})

			.state("auth.resetPsd", {
				url: "/resetPsd",
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/auth/resetPsd.html',
						controller: 'ResetPsdCtrl'
					}
				}
			})

			.state('user', {
				url: '/user',
				abstract: true,
				templateUrl: 'templates/user/home.html'
			})

			.state('user.cityInfo', {
				url: '/cityInfo',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/cityInfo.html',
						controller: 'cityInfoCtrl'
					}
				}
			})

			.state('user.partnerInfo', {
				url: '/partnerInfo',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/partnerInfo.html',
						controller: 'partnerInfoCtrl'
					}
				}
			})

			.state('user.balanceList', {
				url: '/balanceList/:type',
				params: {'type': null},
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/balanceList.html',
						controller: 'balanceListCtrl'
					}
				}
			})

			.state('user.balanceAttorn', {
				url: '/balanceAttorn/:type',
				params: {'type': null},
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/balanceAttorn.html',
						controller: 'balanceAttornCtrl'
					}
				}
			})

			.state('user.offlinePay', {
				url: '/offlinePay/:spid',
				params: {"spid": null},
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/offlinePay.html',
						controller: 'offlinePayCtrl'
					}
				}
			})

			.state('user.center', {
				url: '/center/:spid',
				params: {"spid": null},
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/center.html',
						controller: 'centerCtrl'
					}
				}
			})

			.state('user.applyfor', {
				url: '/applyfor',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/applyfor.html',
						controller: 'applyforCtrl'
					}
				}
			})

			.state('user.qrcode', {
				url: '/qrcode',
				// cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/qrcode.html',
						controller: 'userQrcodeCtrl'
					}
				}
			})

			.state('user.address', {
				url: '/address/:goodsInfo/:type',
				cache: false,
				params: {"goodsInfo": null,'type':null},
				views: {
					'content': {
						templateUrl: 'templates/user/address.html',
						controller: 'UserAddressCtrl'
					}
				}
			})

			.state('user.aboutUs', {
				url: '/aboutUs',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/aboutUs.html',
						controller: 'userAboutUsCtrl'
					}
				}
			})

			.state('user.addAddress', {
				url: '/addAddress/:goodsInfo/:type',
				params: {"goodsInfo": null,'type':null},
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/addAddress.html',
						controller: 'UseraddAddressCtrl'
					}
				}
			})

			.state('user.goodsColl', {
				url: '/goodsColl',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/goodsColl.html',
						controller: 'GoodsCollCtrl'
					}
				}
			})

			.state('user.storeColl', {
				url: '/storeColl/:type',
				// cache: false,
				params:{type:null},
				views: {
					'content': {
						templateUrl: 'templates/user/storeColl.html',
						controller: 'StoreCollCtrl'
					}
				}
			})

			.state('user.footprint', {
				url: '/footprint',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/footprint.html',
						controller: 'FootprintCtrl'
					}
				}
			})

			.state('user.sign', {
				url: '/sign',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/sign.html',
						controller: 'SignCtrl'
					}
				}
			})

			.state('user.management', {
				url: '/management',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/management.html',
						controller: 'ManagementCtrl'
					}
				}
			})

			.state('user.personInfo', {
				url: '/personInfo',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/personInfo.html',
						controller: 'PersonInfoCtrl'
					}
				}
			})

			.state('user.balance', {
				url: '/balance',
				params: {credit2: null,credit1:null,userRedNum:null},
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/balance.html',
						controller: 'BalanceCtrl'
					}
				}
			})

			.state('user.coupon', {
				url: '/coupon',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/coupon.html',
						controller: 'CouponCtrl'
					}
				}
			})

			.state('user.certification', {
				url: '/certification',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/certification.html',
						controller: 'CertificationCtrl'
					}
				}
			})

			.state('user.modifyPsd', {
				url: '/modifyPsd/:type',
				params: {type: null},
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/modifyPsd.html',
						controller: 'ModifyPsdCtrl'
					}
				}
			})

			.state('user.bindAccount', {
				url: '/bindAccount',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/bindAccount.html',
						controller: 'BindAccountCtrl'
					}
				}
			})

			.state('user.orderList', {
				url: '/orderList',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/orderList.html',
						controller: 'OrderListCtrl'
					}
				}
			})

			.state('user.orderLdet', {
				url: '/orderLdet',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/orderLdet.html',
						controller: 'OrderLdetCtrl'
					}
				}
			})

			.state('user.businessQrcode', {
				url: '/businessQrcode',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/businessQrcode.html',
						controller: 'BusinessQrcodeCtrl'
					}
				}
			})

			.state('user.agentCenter', {
				url: '/agentCenter',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/agentCenter.html',
						controller: 'AgentCenterCtrl'
					}
				}
			})

			.state('user.cashback', {
				url: '/cashback',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/cashback.html',
						controller: 'CashbackCtrl'
					}
				}
			})

			.state('user.withdrawals', {
				url: '/withdrawals',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/withdrawals.html',
						controller: 'WithdrawalsCtrl'
					}
				}
			})

			.state('user.balaWithdraw', {
				url: '/balaWithdraw',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/balaWithdraw.html',
						controller: 'balaWithdrawCtrl'
					}
				}
			})

			.state('user.myBalance', {
				url: '/myBalance',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/myBalance.html',
						controller: 'myBalanceCtrl'
					}
				}				
			})

			.state('user.withRecords', {
				url: '/withRecords/:type',
				params: {'type': null},
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/withRecords.html',
						controller: 'WithRecordsCtrl'
					}
				}
			})

			.state('user.commissions', {
				url: '/commissions/:type',
				params: {'type': null},
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/commissions.html',
						controller: 'CommissionsCtrl'
					}
				}
			})

			.state('user.myTeam', {
				url: '/myTeam',
				cache: false,
				views: {
					'content': {
						templateUrl: 'templates/user/myTeam.html',
						controller: 'MyTeamCtrl'
					}
				}
			})

			.state('user.applyAgent', {
				url: '/applyAgent',
				views: {
					'content': {
						templateUrl: 'templates/user/applyAgent.html',
						controller: 'applyAgentCtrl'
					}
				}
			})
			.state('shop', {
				url: '/shop',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})

			.state('shop.center', {
				url: '/center',
				cache:false,
				templateUrl: 'templates/shop/center.html',
				controller: 'shopCenterCtrl'
			})

			.state('shop.qrcode', {
				url: '/center',
				templateUrl: 'templates/shop/qrcode.html',
				controller: 'shopQrcodeCtrl'
			})

			.state('shop.withdraw', {
				url: '/withdraw',
				cache: false,
				templateUrl: 'templates/shop/withdraw.html',
				controller: 'shopWithdrawCtrl'
			})

			.state('shop.withdrawList', {
				url: '/withdrawList',
				cache: false,
				templateUrl: 'templates/shop/withdrawList.html',
				controller: 'shopWithdrawListCtrl'
			})

			.state('shop.moneyInfo', {
				url: '/moneyInfo',
				cache: false,
				templateUrl: 'templates/shop/moneyInfo.html',
				controller: 'moneyInfoCtrl'
			})

			.state('shop.onOrderList', {
				url: '/onOrderList',
				cache: false,
				templateUrl: 'templates/shop/onOrderList.html',
				controller: 'onOrderListCtrl'
			})

			.state('shop.offOrderList', {
				url: '/offOrderList/:type',
				params:{type: null},
				cache: false,
				templateUrl: 'templates/shop/offOrderList.html',
				controller: 'offOrderListCtrl'
			})

			.state('shop.offOrderDetail', {
				url: '/offOrderDetail/:id/:type',
				params:{id: null, type: null},
				cache: false,
				templateUrl: 'templates/shop/offOrderDetail.html',
				controller: 'offOrderDetailCtrl'
			})

			.state('shop.orderDetail', {
				url: '/orderDetail/:id/:spid',
				params:{id: null, spid: null},
				cache: false,
				templateUrl: 'templates/shop/orderDetail.html',
				controller: 'shopOrderDetailCtrl'
			})

			.state('mall', {
				url: '/mall',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})

			.state('mall.returnInfo', {
				url: '/returnInfo/:orderSn',
				params: {'orderSn': null},
				cache: false,
				templateUrl: 'templates/mall/returnInfo.html',
				controller: 'returnInfoCtrl'
			})

			.state('mall.orderDetails', {
				url: '/orderDetails/:orderSn',
				params: {'orderSn': null},
				cache: false,
				templateUrl: 'templates/mall/orderDetails.html',
				controller: 'OrderDetailsCtrl'
			})

			.state('mall.return', {
				url: '/return/:orderSn',
				params: {orderSn: null},
				cache: false,
				templateUrl: 'templates/mall/return.html',
				controller: 'ReturnCtrl'
			})

			.state('mall.evaluate', {
				url: '/evaluate/:orderSn',
				params: {orderSn: null},
				cache: false,
				templateUrl: 'templates/mall/evaluate.html',
				controller: 'EvaluateCtrl'
			})

			.state('mall.list', {
				url: '/list/:type/:k/:spid/:cid/:marking',
				cache: false,
				params: {type: null, 'k': null, spid: null, cid: null, marking: null},
				templateUrl: 'templates/mall/list.html',
				controller: 'listCtrl'
			})

			.state('mall.paySuccess', {
				url: '/paySuccess/:type',
				params: {'type': null},
				cache: false,
				templateUrl: 'templates/mall/paySuccess.html',
				controller: 'PaySuccessCtrl'
			})

			.state('mall.order', {
				url: '/order/:status',
				params: {'status': null},
				// cache: false,
				templateUrl: 'templates/mall/order.html',
				controller: 'UserOrderCtrl'
			})
			.state('mall.payStyle', {
				url: '/payStyle/:orderId/:type',
				params:{orderId:null, type: null},
				cache: false,
				templateUrl: 'templates/mall/payStyle.html',
				controller: 'PayStyleCtrl'
			})

			.state('mall.goods', {
				url: '/goods/:id',
				params:{id:null},
				cache: false,
				templateUrl: 'templates/mall/goods.html',
				controller: 'GoodsCtrl'
			})

			.state('mall.checkout', {
				url: '/checkout/:type/:goodsInfo',
				cache: false,
				params: {'type': null, 'goodsInfo': null},
				templateUrl: 'templates/mall/checkout.html',
				controller: 'CheckoutCtrl'
			})

			.state('mall.lovelife', {
				url: '/lovelife',
				cache: false,
				templateUrl: 'templates/mall/lovelife.html',
				controller: 'LovelifeCtrl'
			})

			.state('mall.foundStore', {
				url: '/foundStore',
				cache: false,
				templateUrl: 'templates/mall/foundStore.html',
				controller: 'FoundStoreCtrl'
			})

			.state('mall.search', {
				url: '/search/:type/:spid',
				params: {'type': null,'spid':null},
				templateUrl: 'templates/mall/search.html',
				controller: 'SearchCtrl'
			})

			.state('mall.shop', {
				url: '/shop/:spid',
				params: {'spid': null},
				cache: false,
				templateUrl: 'templates/mall/shop.html',
				controller: 'ShopCtrl'
			})

			.state('offline', {
				url: '/offline',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})
			.state('offline.newsList', {
				url: '/newsList',
				cache: false,
				templateUrl: 'templates/offline/newsList.html',
				controller: 'NewsListCtrl'
			})
			.state('offline.newsInfo', {
				url: '/newsInfo/:id',
				params: {'id': null},
				cache: false,
				templateUrl: 'templates/offline/newsInfo.html',
				controller: 'NewsInfoCtrl'
			})
			.state('offline.shopInfo', {
				url: '/shopInfo/:spid',
				params: {'spid': null},
				cache: false,
				templateUrl: 'templates/offline/shopInfo.html',
				controller: 'ShopInfoCtrl'
			})
			.state('offline.shopList', {
				url: '/shopList/:cid/:keywords/:title',
				params: {'cid':null, 'keywords': null, 'title':null},
				cache: false,
				templateUrl: 'templates/offline/shopList.html',
				controller: 'ShopListCtrl'
			})
			


		$urlRouterProvider.otherwise('auth/languages/1');
	});
