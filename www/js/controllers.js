angular.module('starter.controllers', [])

	.controller('HomeCtrl', function ($scope, Home, $ionicSlideBoxDelegate, $ionicLoading, List, $sce, User, $timeout, $cordovaInAppBrowser, Message, $state) {
		$scope.focuslListData = {};
		$scope.navList = {navUrl:['tab.my','tab.order','tab.cart','tab.category','tab.home']};
		$scope.custom = {};
		$scope.moreGoods = [];
		$scope.isShowPage = false;
		$scope.isShowPic = true;

		$scope.$on('$ionicView.beforeEnter', function () {
			if (!User.checkAuth()) {
				$scope.checkAuth = false;
			}else{
				$scope.checkAuth = true;
			}
		});

		// $scope.paySrc = $sce.trustAsResourceUrl('http://www.iqiyi.com/w_19rraew70l.html');



		Home.fetch();
		$scope.$on('home.updated', function () {
			// 获取幻灯
			$scope.focuslListData = Home.getFocusList();
			$ionicSlideBoxDelegate.$getByHandle("slideimgs").loop(true);
			$ionicSlideBoxDelegate.update();
			$scope.isShowPic = false;
			// 获取导航菜单
			$scope.navList = Home.getNavList();
			if($scope.navList.length > 1){
				$scope.isShowPage = true;
			}else{
				$scope.isShowPage = false;
			}
			// 热门商品
			$scope.hotGoods = Home.hotGoods();
			// 发现好店
			$scope.content1 = $sce.trustAsHtml(Home.content1());
			// 爱生活
			$scope.content2 = $sce.trustAsHtml(Home.content2());
			// 获取自定义
			$scope.content= $sce.trustAsHtml(Home.content());
		});
		// 获取商品推荐
		Home.fetchMoreGoods(function (response) {
			if(response.code == 0){
				$scope.moreGoods = response.data;
			}else if(response.code == 1){
				Message.show(response.msg);
			}
		});

		$scope.toUrl = function (id, types) {
			Home.getNav(id, types).then(function (data) {
				if(data.link.url == 'shop.shops'){
					$state.go('mall.shop',{spid:data.link.param.id});
				}else if(data.link.url == 'goods'){
					$state.go('mall.goods',{id:data.link.param.id});
				}else if(data.link.url == 'dapp.category'){
					$state.go('mall.list',{cid:data.link.param.id, type: 'goods'});
				}else if(data.link.url == 'dapp.order'){
					$state.go('mall.order',{status: 0});
				}else if(data.link.http == 1){
					document.addEventListener("deviceready", function () {
						var options = {
							location: 'yes',
							clearcache: 'yes',
							toolbar: 'yes',
							toolbarposition: 'top'

						};
						$cordovaInAppBrowser.open(data.link.url, '_self', options)
							.then(function(event) {
								console.log(event)
							})
							.catch(function(event) {
								// error
								console.log(event)
							});
					}, false);
				}else{
					$state.go(data.link.url);
				}
			});
		};

		$scope.isShowBtm = false;
		// 下拉刷新
		$scope.doRefresh = function () {
			// Home.fetch();
			Home.fetchMoreGoods(function (response) {
				$scope.moreGoods = response.data;
				$scope.isShowBtm = false;
				$scope.noMoreGoods = false;
				$timeout(function () {
					$scope.noMoreGoods = true;
				}, 1500);
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
				$scope.page = 2;
			});

		};
		// 下拉加载更多商品
		$scope.noMoreGoods = true;
		$scope.page = 2;
		$scope.loadMoreGoods = function () {
			Home.fetchMoreGoods(function (response) {
				if(response.code == 0){
					$scope.page++;
					$scope.moreGoods = $scope.moreGoods.concat(response.data);
					$scope.$broadcast('scroll.refreshComplete');
					$scope.noMoreGoods = false;
					$timeout(function () {
						$scope.noMoreGoods = true;
					}, 1500);
				}else if(response.code != 0){
					$scope.isShowBtm = true;
					$scope.noMoreGoods = false;
				}
			}, function (error) {
				Message.show(error.message);
			}, $scope.page);
		};

//		搜店铺或商品
		$scope.showDrop = false;
		$scope.searchType = 'goods';
		$scope.getShop = function (selectType, name) {
			document.getElementById('getSelect').innerHTML = name;
			$scope.searchType = selectType;
			$scope.showDrop = false;
		};

		$scope.search = function () {
			List.search($scope.searchType, $scope.keywords);
		}
	})

	.controller('CategoryCtrl', function ($scope, Category, $cordovaInAppBrowser, List, $ionicSideMenuDelegate, Message) {
		// $cordovaInAppBrowser.open("http://develop.weiyuntop.com/app/1", '_self');
		// Category.fetch();
		// $scope.cateTree = 0;
		$scope.cur = 0;
		$scope.catedetail = {};
		$scope.orderEmpty = false;
		getCatedetail();
		$scope.searchType = 'goods';
		// 改变列表导航
		$scope.changCate = function (cid) {
			$scope.cur = cid;
			getCatedetail();
		}
		$scope.myVar = true;
		$scope.toggle = function () {
			$scope.myVar = !$scope.myVar;
		}

		function getCatedetail() {
			Category.getCategory(function (response) {
				Message.hidden();
				if(response.code == 0){
					$scope.orderEmpty = false;
					$scope.catedetail = response.data;
				}else if(response.code == 1){
					$scope.orderEmpty = true
				}
			},function (error) {
				Message.show(error.message);
			},$scope.searchType);
		}

		$scope.search = function () {
			List.search($scope.searchType, $scope.keywords);
		}
	})

	.controller('GoodsCtrl', function ($scope, $rootScope, $http, $timeout, $ionicScrollDelegate, $interval, $stateParams, ENV, Goods, $sce, User, $state, $ionicSlideBoxDelegate, $ionicPopover, $ionicLoading, Message, Storage) {
		var goodsId = $stateParams.id;
		/*随机下单参数*/
		$scope.randomNum = 1;
		$scope.randomBol = false;
		$scope.isShowPage = false;
		$scope.priceNum = 0;
		$scope.goods = {};
		$scope.bis = [];
		$scope.goodsPrice = '';
		$scope.myVar = false;
		$scope.isShowPic = true;
		Goods.fetch(goodsId); //请求数据

		$scope.$on('goods.updated', function () {
			$scope.goods = Goods.getGoods();
			$scope.isShowPic = false;
			if($scope.goods.thumbs.length > 0){
				$scope.isShowPage = true;
			}else{
				$scope.isShowPage = false;
			}
			$scope.randomUser = $scope.goods.randomUser; //随机下单数据
			$scope.goodsOp = $scope.goods.attrList.size; //商品规格
			if($scope.goodsOp){
				$scope.attrId = $scope.goodsOp[0].id; //获取商品规格ID
			}else{}
			$scope.chajia = $scope.goods.addPrice; //每次加的价格
			if($scope.goods.openLimitBuy == 1){
				dataReady();
			}else{
				$scope.countShow = false;
			}
			$ionicSlideBoxDelegate.$getByHandle("goodsSlide").loop(true);
			$ionicSlideBoxDelegate.update();
			//Goods.initAttrSelect();
		});

		//倒计时
		var timer;
		function dataReady(){
			$scope.limitBuyConfig = JSON.parse($scope.goods.limitBuyConfig);
			//立即购买处的价格等于折扣价
			$scope.price = $scope.limitBuyConfig.price;
			var now = new Date();
			var diff = Date.parse($scope.limitBuyConfig.end) - now.getTime();
			if(!(diff > 0)){
				//当没有开始时间或结束时间；当结束时间小于开始时间时
				$scope.countShow = false;
				return;
			}else{
				//当开启限时购
				$scope.countShow = true;
//				var spe_price = $scope.goods.spe_price;
//				console.log(spe_price)
//				$scope.goods.spe_price = $scope.limitBuyConfig.price
			}
			$scope.hour = Math.floor(diff/3600000);
			var lessHour = diff%3600000;
			$scope.minute = Math.floor(lessHour/60000);
			var lessMinute = lessHour%60000
			$scope.second = Math.floor(lessMinute/1000);
			timer = $interval(function(){
				$scope.second--;
				if($scope.second == 0 && $scope.minute == 0 && $scope.hour == 0){
					//倒计时结束
					$scope.goods.spe_price = spe_price;
					$interval.cancel(timer);
					$scope.countEnd = true;
				}
				if($scope.second == -1){
					$scope.second = 59;
					$scope.minute--;
					//				$scope.$apply();
					if($scope.minute == -1){
						$scope.minute = 59;
						$scope.hour --;
						//					$scope.$apply();
					}
				}

			},1000)

		}
		$scope.countEnd = false;
		///在切换控制器的时候，清除定时器，减少内存损耗
		$scope.$on("$destroy",function() {
				$interval.cancel(timer);
			}
		);


		// $timeout(function () {
		// 	$scope.randomBol = true;
		// 	$interval(function () {
		// 		$scope.randomNum++;
		// 		if ($scope.randomNum > $scope.randomUser.count) {
		// 			$scope.randomNum = 1;
		// 		}
		// 	}, 5000);
		// }, 5000);

		$scope.selectAttr1 = function (id, index) {
			$scope.attrSelected = id;
			$scope.opIndex1 = index;
			$scope.opIndex2 = 0;
			$scope.priceNum = 0; //初始化价格库存
			Goods.getGoodsOp(function (response) {
				if (response.code == 0) {
					$scope.goodsOp = response.data;
					$scope.attrId = $scope.goodsOp[0].id;
				} else {
					alert(response.msg);
				}
			}, function (error) {
				console.log(error.message);
			}, {attrid: id, id: goodsId})
		};

		$scope.selectAttr2 = function (id, index) {
			$scope.opIndex2 = index;
			$scope.opId2 = id;
			$scope.attrId = id;
			$scope.priceNum = index;
		};

		// 商品购买
		$scope.buyType = 1;//1：添加到购物车2：立即购买3:登陆
		$scope.buyNum = 1;
		$scope.addNum = function () {
			$scope.buyNum++;
		};
		$scope.minusNum = function () {
			if ($scope.buyNum > 1) {
				$scope.buyNum--;
			}
		};
		$scope.login = function () {
			$rootScope.href = window.location.href;
			Storage.set("href", $rootScope.href);
			$scope.popover.hide();
			$state.go('auth.login');
		};

		/*加入购物车*/
		$scope.addCart = function () {
			console.log($scope.attrId);
			$http.post(ENV.API_URL, {
				do: 'cart',
				op: 'add',
				type: 'add',
				goodsId: goodsId,
				attrId: $scope.attrId,
				goodsNum: $scope.buyNum
			}, {timeout: 2000}).success(function (respond) {
				if (respond.code == 0) {
					$ionicLoading.show({
						noBackdrop: true,
						template: respond.msg,
						duration: '1200'
					}).then(function () {
						$scope.popover.hide();
					});
				} else {
					$ionicLoading.show({
						noBackdrop: true,
						template: respond.msg,
						duration: '1200'
					}).then(function () {
						$scope.popover.hide();
					});
				}
			}).error(function () {
				$scope.popover.hide();
				$ionicLoading.show({
					noBackdrop: true,
					template: '通信超时，请重试！',
					duration: '1000'
				});
			})
		};

		$scope.buyInterim = function () {
			$http.post(ENV.API_URL, {
				do: 'cart',
				op: 'interim',
				goodsId: goodsId,
				opt: $scope.attrId,
				goodsNum: $scope.buyNum
			}, {timeout: 2000}).success(function (respond) {
				$scope.popover.hide();
				if (respond.code == '301') {
					$state.go("mall.checkout", {type: 'interim', goodsInfo: respond.data});
				} else if(respond.code == 1){
					Message.show(response.msg)
				}
			}).error(function () {
				$scope.popover.hide();
				$ionicLoading.show({
					noBackdrop: true,
					template: '通信超时，请重试！',
					duration: '1000'
				});
			});
		};

		// 购买遮罩层
		$ionicPopover.fromTemplateUrl('templates/modal/goods-popover.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});

		// 立即购买
		$scope.buyInterimShow = function () {
			$scope.buyType = User.checkAuth() ? 2 : 3;
			$scope.popover.show();
		};

		// 添加到购物车
		$scope.buyAddCartShow = function () {
			$scope.buyType = User.checkAuth() ? 1 : 3;
			$scope.popover.show();
		};
		$scope.selectNav = '商品';
		$scope.hnavs = ['商品', '详情', '评论'];
		$scope.active = function (hnav) {
			$ionicScrollDelegate.scrollTop();
			$scope.selectNav = hnav;
		};
		// 收藏店铺
		$scope.shoucangShop = function () {
			if ($scope.goods.isCare == 0) {
				$scope.goods.isCare = 1;
			} else if ($scope.goods.isCare != 0) {
				$scope.goods.isCare = 0;
			}
			Goods.shoucangShop(function (response) {

			}, function (error) {
				Message.show(error.message)
			}, $scope.goods.spid, 'spid')
		};

		// 收藏商品
		$scope.shoucangGoods = function () {
			if ($scope.goods.isLike == 0) {
				$scope.goods.isLike = 1;
			} else if ($scope.goods.isLike != 0) {
				$scope.goods.isLike = 0;
			}
			Goods.shoucangShop(function () {
			}, function () {
			}, $scope.goods.id, 'id')
		}

		// // 购买遮罩层
		// $ionicPopover.fromTemplateUrl('templates/home/goods-popover.html', {
		// 	scope: $scope
		// }).then(function (popover) {
		// 	$scope.popover = popover;
		// });
        //
		// // 立即购买
		// $scope.buyInterimShow = function () {
		// 	$scope.popover.show();
		// };
	})

	.controller('OrderListCtrl', function ($scope, Cart, Home, $timeout, $state, Message, $rootScope, User, Storage) {

	})

	.controller('OrderLdetCtrl', function ($scope, Cart, Home, $timeout, $state, Message, $rootScope, User, Storage) {

	})

	.controller('AgentCenterCtrl', function ($scope, Cart, Home, $timeout, $state, Message, $rootScope, User, Storage) {
		$scope.agent = {};
		User.getAgent(function (response) {
			Message.hidden();
			if (response.code != 0) {
				Message.show(response.msg);
				$timeout(function () {
					$state.go('tab.my');
				}, 1500)
			}
			$scope.agent = response.data;

		}, function (error) {
			Message.show(error.message)
		});
	})

	.controller('WithdrawalsCtrl', function ($scope, Cart, Home, $timeout, $state, Message, $rootScope, User, $ionicPopover, $stateParams) {
		$scope.withdraw = {};
		$scope.type = $stateParams.type;
		$scope.info = {withTitle: '', withType: '',money: '', username: '', mobile: '', card: '', cardType: '', alipay: ''};
		User.userWithdraw(function (response) {
			if(response.code == 0){
				$scope.withdraw = response.data;
			}else if(response.code == 1){
				Message.show(response.msg)
			}

		}, function (error) {
			Message.show(error.message);
		});
		// 筛选遮罩层
		$ionicPopover.fromTemplateUrl('templates/modal/withType.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});
		$scope.selectType = function () {
			$scope.popover.show();
		};
		$scope.selectOption = function (title, type) {
			$scope.popover.hide();
			$scope.info.withTitle = title;
			$scope.info.withType = type;
		}
		$scope.withSub = function () {
			if (!$scope.info.withType) {
				Message.show('请选择提现方式！');
				return false;
			}
			if (!$scope.info.money) {
				Message.show('请填写提现金额！');
				return false;
			}
			if (!$scope.info.username) {
				Message.show('请填写真实姓名！');
				return false;
			}
			if (!$scope.info.mobile) {
				Message.show('请填写联系电话！');
				return false;
			}
			if ($scope.info.withType == 'bankCard' && !$scope.info.card) {
				Message.show('请填写银行卡号！');
				return false;
			}
			if ($scope.info.withType == 'bankCard' && !$scope.info.cardType) {
				Message.show('请填写开户行！');
				return false;
			}
			if ($scope.info.withType == 'alipay' && !$scope.info.alipay) {
				Message.show('请填写支付宝账号！');
				return false;
			}

			User.userWithdrawSuccess(function (res) {
				Message.hidden();
				if (res.code == 0) {
					$state.go('user.withRecords');
					$timeout(function () {
						Message.show('提现申请成功！')
					},1200)
				} else {
					Message.show(res.msg);
					return false;
				}
			},function () {

			},$scope.info);
		}
	})

	.controller('WithRecordsCtrl', function ($scope, Cart, Home, $timeout, $state, Message, $rootScope, User, $ionicLoading, $stateParams) {
		$scope.withdrawList = {};
		$scope.orderEmpty = false;
		var common;
		if($stateParams.type == 'balance'){
			common = User.toMoneyList
		}else{
			common = User.userWithdrawList
		}
		common(function (res) {
			Message.hidden();
			if(res.code == 0){
				$scope.withdrawList = res.data;
				if($scope.withdrawList.list == ''){
					$scope.orderEmpty = true;
				}else{
					$scope.orderEmpty = false;
				}
			}else if(res.code == 1){
				Message.show(res.msg)
			}
		}, function (error) {
			Message.show(error.message)
		});

		// 列表下拉刷新
		$scope.doRefresh = function () {
			common(function (response) {
				Message.hidden();
				$scope.noMore = false; //下拉加载时避免上拉触发
				$scope.withdrawList = response.data;
				$timeout(function () {
					$scope.noMore = true;
				}, 1500);
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			},function () {

			});
		};
		// 下拉加载更多商家
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			common(function (response) {
				Message.hidden();
				$scope.page++;
				if(response.code == 0){
					if(response.data.list == '' || !response.data.list){
						$ionicLoading.show({
							noBackdrop: true,
							template: '没有更多记录了！',
							duration: '1200'
						});
						$scope.noMore = false;
					}else{
						$scope.withdrawList.list = $scope.withdrawList.list.concat(response.data.list);
						$scope.$broadcast('scroll.refreshComplete');
						$scope.noMore = false; //下拉加载时避免上拉触发
						$timeout(function () {
							$scope.noMore = true;
						}, 1500);
					}
				}

			},function () {

			},$scope.page);
		};
	})

	.controller('CommissionsCtrl', function ($scope, $stateParams, Message, User, $ionicLoading, $timeout, $ionicScrollDelegate) {
		$scope.myVar = false;
		$scope.type = $stateParams.type;
		$scope.agentList = {};
		$scope.orderEmpty = false;
		$scope.toggle = function () {
			$scope.myVar = !$scope.myVar
		};
		saveAgent($scope.type);
		$scope.agentListDet = function(type){
			saveAgent(type);
			$scope.type = type;
			$scope.myVar = !$scope.myVar;
			$ionicScrollDelegate.scrollTop();
			$scope.page = 2;
			$scope.noMore = true;
		};
		function saveAgent(type) {
			User.getAgentList(function (res) {
				if(res.code == 0){
					$scope.agentList = res.data;
					if($scope.agentList.list == ''){
						$scope.orderEmpty = true
					}else{
						$scope.orderEmpty = false
					}
				}

			}, function (error) {
				Message.show(error.message);
			}, type);
		};
		// 列表下拉刷新
		$scope.doRefresh = function () {
			User.getAgentList(function (response) {
				Message.hidden();
				$scope.noMore = false; //下拉加载时避免上拉触发
				$scope.agentList = response.data;
				$timeout(function () {
					$scope.noMore = true;
				}, 1500);
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			},function () {

			}, $scope.type);
		};
		// 下拉加载更多商家
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.getAgentList(function (response) {
				Message.hidden();
				console.log(response.data.list);
				if(response.code == 0){
					if(response.data.list == '' || !response.data.list){
						$ionicLoading.show({
							noBackdrop: true,
							template: '没有更多记录了！',
							duration: '1200'
						});
						$scope.noMore = false;
					}else{
						$scope.page++;
						$scope.agentList.list = $scope.agentList.list.concat(response.data.list);
						$scope.$broadcast('scroll.refreshComplete');
						$scope.noMore = false; //下拉加载时避免上拉触发
						$timeout(function () {
							$scope.noMore = true;
						}, 1500);
					}
				}
			},function () {

			},$scope.type, $scope.page);
		};
	})

	.controller('MyTeamCtrl', function ($scope, $timeout, $state, Message, $rootScope, User, $ionicLoading, $ionicScrollDelegate) {
		$scope.team = {};
		$scope.orderEmpty = false;
		getTeam();
		function getTeam(level, uid) {
			User.getTeam(function (response) {
				Message.hidden();
				if(response.code == 0){
					$scope.orderEmpty = false;
					$scope.team = response.data;
				}else if (response.code != 0) {
					$scope.orderEmpty = true;
				}
			}, function (error) {
				Message.show(error.message)
			}, level, uid);
		}

		$scope.level = 1;
		$scope.active = function (level, uid) {
			$scope.level = level;
			$scope.uid = uid;
			$ionicScrollDelegate.scrollTop();
			$scope.noMore = true;
			$scope.page = 2;
			getTeam(level, uid);
		};
		// 列表下拉刷新
		$scope.doRefresh = function () {
			User.getTeam(function (response) {
				Message.hidden();
				$scope.noMore = false; //下拉加载时避免上拉触发
				$scope.team = response.data;
				$timeout(function () {
					$scope.noMore = true;
				}, 1500);
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
				$scope.page = 2;
			}, function (error) {
				Message.show(error.message)
			}, $scope.level, $scope.uid);

		};
		// 下拉加载更多商家
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.getTeam(function (response) {
				Message.hidden();
				if(response.code == 0){
					$scope.page++;
					$scope.team.list = $scope.team.list.concat(response.data.list);
					$scope.$broadcast('scroll.refreshComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					}, 1500);
				}else if(response.code != 0){
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多了！',
						duration: '1200'
					});
					$scope.noMore = false;
				}
			},function (error) {
				Message.show(error.message)
			}, $scope.level, $scope.uid, $scope.page);

		};
	})

	.controller('BusinessQrcodeCtrl', function ($scope, Cart, Home, $timeout, $state, Message, $rootScope, User, Storage) {
		Cart.getshopQrcode(function(res){
			if(res.code == 301){
				$scope.QRcode = res.data;
			}else if(res.code == 1){
				Message.show(res.msg)
			}
		},function(){},$rootScope.globalInfo.data.isDappShop)
	})

	.controller('CartCtrl', function ($scope, Cart, Home, $timeout, $state, Message, $rootScope, User, Storage) {
		$scope.pageInfo = {};
		$scope.pageInfo.data = {};
		$scope.$on('$ionicView.beforeEnter', function () {
			$rootScope.href = window.location.href;
			Storage.set("href", $rootScope.href);
			if (!User.checkAuth()) {
				$scope.checkAuth = false;
			}else{
				$scope.checkAuth = true;
			}
		});
		Cart.getCartInfo(function (response) {
			Message.hidden();
			$scope.pageInfo.data = response.data;
			if(response.data != ''){
				$scope.orderEmpty = false
			}else{
				$scope.orderEmpty = true
			}
		}, function (error) {
			Message.show(error.message);
		});
// 获取商品推荐
		$scope.goodsShow = false;
		Home.fetchMoreGoods(function (response) {
			if(response.code == 0){
				$scope.moreGoods = response.data;
				$scope.goodsShow = true;
			}else if(response.code == 1){
				$scope.goodsShow = false;
			}
		});

		var _timer = null;  //重复点击定时器
		var _delBtn = true; //删除按钮

		$scope.opNum = function (id, spid, op) {//商品添加减少
			if (op == 1) {
				angular.forEach($scope.pageInfo.data.cartList[spid]['goods'], function (v) {
					if (v.id == id) {
						if (v.goodsNum <= 1) {
							Message.show('~~~~(>_<)~~~~，不能再少了');
							return;
						}
						v.goodsNum--;

						if (_timer) {
							$timeout.cancel(_timer);
							_timer = $timeout(function () {
								getNewCartInfo({cartId: id, num: v.goodsNum, type: 1});
								_timer = null;
							}, 500);
							return;
						}
						_timer = $timeout(function () {
							getNewCartInfo({cartId: id, num: v.goodsNum, type: 1});
							_timer = null;
						}, 500)
					}
				})
			} else {
				angular.forEach($scope.pageInfo.data.cartList[spid]['goods'], function (v) {
					if (v.id == id) {
						v.goodsNum++;

						if (_timer) {
							$timeout.cancel(_timer);
							_timer = $timeout(function () {
								getNewCartInfo({cartId: id, num: v.goodsNum, type: 1});
								_timer = null;
							}, 500);
							return;
						}
						_timer = $timeout(function () {
							getNewCartInfo({cartId: id, num: v.goodsNum, type: 1});
							_timer = null;
						}, 500);
					}
				})

			}
		};

		//删除商品
		$scope.del = function (id) {
			if (_delBtn) {
				getNewCartInfo({cartId: id, type: 2});
			}
			_delBtn = false;
		};

		//全选
		$scope.allCheck = function () {
			var _bol = $scope.pageInfo.data.isCheck - 0;
			if (_bol) {
				getNewCartInfo({type: 'check', arr: ''});
			} else {
				getNewCartInfo({type: 'check', arr: getId()});
			}
		};

		//商家和商品点击
		$scope.otherCheck = function (type, spid, id, checked) {
			if (type == 'shops') {
				if ($scope.pageInfo.data.cartList[spid].ischeck) {
					getNewCartInfo({type: 'check', arr: getId('shops', false, spid)});
				} else {
					getNewCartInfo({type: 'check', arr: getId('shops', true, spid)});
				}
			} else if (type == "goods") {
				if (checked) {
					getNewCartInfo({type: 'check', arr: getId('goods', false, spid, id)});
				} else {
					getNewCartInfo({type: 'check', arr: getId('goods', true, spid, id)});
				}
			}
		};

		//获取全部商品ID 以及剩下的ID
		function getId(type, bol, spid, id) {
			var arr = [];
			if (!type && !spid) {
				angular.forEach($scope.pageInfo.data.cartList, function (data) {
					angular.forEach(data.goods, function (v) {
						arr.push(v.id);
					})
				});
			} else if (type == 'shops') {
				angular.forEach($scope.pageInfo.data.cartList, function (data, index) {
					angular.forEach(data.goods, function (v) {
						if (v.spid == spid && !bol) { //如果父级id并且全选或者全否
						} else {
							if (v.spid == spid && bol) {
								arr.push(v.id);
							} else if ((v.ischeck - 0)) {
								arr.push(v.id);
							}
						}
					});
				});
			} else if (type == 'goods') {
				angular.forEach($scope.pageInfo.data.cartList, function (data) {
					angular.forEach(data.goods, function (v) {
						if (v.id == id && !bol) {
						} else {
							if (!(v.ischeck - 0) && v.id != id) {
							} else {
								arr.push(v.id);
							}
						}
					})

				});
			}
			return arr.join(',');
		}

		$scope.go = function () {
			if ($scope.pageInfo.data.countPrice - 0) {
				$state.go('mall.checkout',{type: 'cart'});
			} else {
				Message.show('请至少选择一种商品', 1000);
			}
		};

		//请求数据
		function getNewCartInfo(para) {
			Cart.getNewCartInfo(function (response) {
				if (response.code == 0) {
					$scope.pageInfo.data = response.data;
					if(response.data != ''){
						$scope.orderEmpty = false
					}else{
						$scope.orderEmpty = true
					}
				} else {
					Message.show(response.msg);
				}
				_delBtn = true;
			}, function (error) {
				Message.show(error.message);
			}, para)
		}
	})


	.controller('mallGoodsCtrl', function ($scope, $http, $timeout, $state, $stateParams, Cart, Payment, Message, $ionicPopup) {

	})

	.controller('CheckoutCtrl', function ($scope, $http, $timeout, $state, $stateParams, Cart, Payment, Message) {
		var checkoutPara = $stateParams.goodsInfo;
		$scope.source = $stateParams.type;
		var model = 'bbc';
		$scope.pay = {note: ''};
		$scope.type = $stateParams.type;
		$scope.checkoutPara = checkoutPara;
		$scope.orderInfo = {pointBtn: '1', coin: ''};
		// 获取初始数据
		$scope.checkout = {};
		Cart.fetchCheckoutData(function (res) {
			if(res.code == 0){
				$scope.checkout = res.data
			}else{
				Message.show(res.msg)
			}
			if($stateParams.type == 'cart'){
				if(res.code == 301){
					$state.go('tab.cart')
				}
			}
		},function () {

		},$stateParams.type, $stateParams.goodsInfo);

		$scope.$on('checkout.updated', function () {
			$scope.checkout = Cart.getCheckout();

			// 获取支付方式
			if($scope.checkout.credit3_pay == 1){
				$scope.payType = 'credit';
			}else{
				$scope.payType = 'alipay';
			}
			$scope.needPay = $scope.checkout.countPrice;
		});
		$scope.toPay = function () {
			if (!$scope.checkout.address) {
				Message.show('请添加默认地址，继续下单', 1500);
				return false
			}

			Payment.getOrderInfo('save',$scope.checkoutPara, $scope.pay.note).then(function (res) {
				if(res.code == 0){
					$state.go('mall.payStyle',{orderId:res.data});
				}else if(res.code == 1){
					Message.show(res.msg)
				}
			})

		}
	})


	.controller('PayStyleCtrl', function ($scope, $http, $timeout, $state, $stateParams, Cart, Payment, Message, $ionicPopover, $ionicPopup) {
		$scope.orderId = $stateParams.orderId;
		$scope.type = $stateParams.type;
		$scope.checkout = {};
		$scope.payType = 'credit';
		$scope.selectPayType = function (type) {
			$scope.payType = type
		};
		Payment.getOrderInfo('get',$scope.orderId).then(function (res) {
			if(res.code == 0){
				$scope.checkout = res.data
			}else if(res.code == 1){
				Message.show(res.msg)
			}
		});
		$ionicPopover.fromTemplateUrl('templates/modal/pay-popover.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});
		$scope.orderConfirm = function () {
			if ($scope.payType == 'wechat') {
				Payment.wechatPay($scope.orderId);
			} else if ($scope.payType == 'alipay') {
				Payment.alipay($scope.orderId);
			} else if ($scope.payType == 'credit') {
				$scope.popover.show();
			} else if ($scope.payType == 'hxpay') {
				Payment.hxpay($scope.orderId);
			}

		};
		$scope.creditPay = function () {
			$scope.popover.hide();
			$scope.info = {payPwd: ''};
			$ionicPopup.show({
				title: '支付密码',
				template: '<input type = "password" placeholder="请输入支付密码" ng-model="info.payPwd" id="s_payPassword" style="padding-left: 10px">',
				scope: $scope,
				buttons: [
					{
						text: '取消', onTap: function () {
						return false;
					}
					},
					{
						text: '确定', type: 'button-assertive', onTap: function (e) {
						if (!$scope.info.payPwd) {
							Message.show('请输入支付密码！');
							e.preventDefault();
						} else {
							Payment.creditPay(function (response) {
								if (response.code == 0) {
									Message.show('支付成功', 1500);
									$http.post(response.data);
									$timeout(function () {
										$state.go('mall.paySuccess', {type: $scope.type});
									}, 1500)
								} else if (response.code == 1) {
									Message.show(response.msg);
								}
							}, function () {

							}, $scope.orderId,$scope.info.payPwd);
						}
					}
					}
				]
			})
		}
	})

	.controller('UserAddressCtrl', function ($scope, Message, $state, $stateParams, Mc, Area, $ionicModal, $ionicScrollDelegate,$ionicPopover,$ionicPopup) {
		var isBuy = !!$stateParams.isBuy || false;
		$scope.goodsInfo = $stateParams.goodsInfo;
		$scope.type = $stateParams.type;
		$scope.pageInfo = {};
		$scope.userInfo = {};
		//获取地址列表
		function getInfo() {
			Mc.getUserAddress(function (response) {
				Message.hidden();
				if (response.code == 0) {
					$scope.pageInfo = response;
					$scope.defaultAddredd = response.data;
					console.log(response)
				} else {
					$scope.pageInfo = response;
				}
			}, function (error) {
				Message.show(error.message);
			});
		}
		getInfo();
		// 筛选遮罩层
		$ionicPopover.fromTemplateUrl('templates/user/address-popover.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});
		//删除地址
		$scope.removeAddress = function (id, $event) {
			$event.stopPropagation();

			$ionicPopup.confirm({
				template: '确认要删除该地址吗？',
				buttons: [
					{
						text: '取消',onTap: function () {
						return false;
					}
					},
					{
						text: '确定', type: 'button-assertive', style:'height:36px;min-height:36px', onTap: function () {
						Mc.removeUserAddress(function (response) {
							Message.show(response.msg, 1500);
							if (response.code == 0 || response.code == 301) {
								$scope.pageInfo = response;
							}
						}, function (error) {
							Message.show(error.message);
						}, id);
					}
					}
				]
			})

		};
		//设为默认
		$scope.defaultAdd = function (id, index) { //设置成默认
			if ($scope.pageInfo.data[index].isdefault - 0) {
				Message.show('已经为默认地址，无需重新设置', 1000);
				return false;
			}
			Mc.defaultAddress(function (response) {
				Message.hidden();
				if (response.code == 301) {
					angular.forEach($scope.pageInfo.data, function (v) {
						// console.log(v)
						v.isdefault = 0;
					});
					$scope.pageInfo.data[index].isdefault = 1;
					Message.show('设置默认地址成功！', 1000);
					if($scope.type == 'xshop'){
						$state.go('mall.beanCheckout', {goodsNum: $stateParams.goodsNum, goodsId:$stateParams.goodsId, spid:$stateParams.spid, type: $stateParams.type});
						// console.log('22');
						// console.log($stateParams.goodsNum);
					}else{
						console.log('1');
						// if (isBuy) {
							console.log('2');
							$state.go('mall.checkout', {"goodsInfo": $stateParams.goodsInfo, type: $scope.type});
						// }
					}

				} else {
					Message.show(response.msg);
				}
			}, function (error) {
				Message.show(error.message);
			}, id)
		};
		//更新地址
		$scope._update = function (id, $event) {
			$event.stopPropagation();
			angular.forEach($scope.defaultAddredd, function (v, k) {
				if (v.id == id) {
					$scope.updateData = v;
				}
			});
			console.log($scope.updateData)
			console.log($scope.userInfo)
			$scope.pageInfo.code = 301;
			$scope._type = 1;
			$scope._id = id;
			var _s = $scope.userInfo;
			_s.name = $scope.updateData.username;
			_s.mobile = $scope.updateData.mobile;
			_s.infoAddress = $scope.updateData.address;
			_s.sex=$scope.updateData.sex;
			_s.area = $scope.updateData.province + ' ' + $scope.updateData.city + ' ' + $scope.updateData.district;
		};
		//保存修改
		$scope.modify = function(){
			var _s = $scope.userInfo;
			console.log(_s)
			Mc.addAddress(function (response) {
				Message.show(response.msg);
				if (response.code == 301) {
					_s.name = '';
					_s.mobile = '';
					_s.infoAddress = '';
					_s.area = '';
					_s.sex=1;
					$scope._type = 0;
					getInfo();
					$scope.pageInfo.code = 0;
				}

			}, function (error) {
				Message.show(error.message);
			}, _s, $scope._type, $scope._id)
		};
		// 筛选
		$scope.areaShow = function () {
			Area.getList(function (data) {
				$scope.areaList = $scope.areaData = data;
			});
			$scope.popover.show();
		};
		$scope._del = function () { //关闭添加地址结构页面
			$scope.pageInfo.code = 0;
			var _s = $scope.up.userInfo;
			_s.name = '';
			_s.mobile = '';
			_s.infoAddress = '';
			_s.area = '';
			$scope._type = 0;
		};
		//选择地址
		$scope.selectArea = function (id) {
			$ionicScrollDelegate.scrollTop();
			var pid = id.substr(0, 2) + "0000";
			var cid = id.substr(0, 4) + "00";
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00" && id.substr(4, 2) != "00") {
				$scope.userInfo.area = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + $scope.areaData[pid]['cities'][cid]['districts'][id];
				$scope.popover.hide();
				return true;
			}
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'][id]['districts'];
				if ($scope.areaList.length <= 0) {
					$scope.userInfo.area = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + "其他（县/区）";
					$scope.popover.hide();
				}
				return true;
			}
			if (id.substr(0, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'];
				return true;
			}
		};
	})

	.controller('UseraddAddressCtrl', function ($scope, $stateParams, $state,$ionicPopover,Area,$ionicScrollDelegate,Mc,Message) {
		$scope.userInfo = {area:''};
		// 筛选遮罩层
		$ionicPopover.fromTemplateUrl('templates/user/address-popover.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});

		// 筛选
		$scope.areaShow = function () {
			Area.getList(function (data) {
				$scope.areaList = $scope.areaData = data;
			});
			$scope.popover.show();
		};
		//选择地址
		$scope.selectArea = function (id) {
			$ionicScrollDelegate.scrollTop();
			var pid = id.substr(0, 2) + "0000";
			var cid = id.substr(0, 4) + "00";
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00" && id.substr(4, 2) != "00") {
				$scope.userInfo.area = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + $scope.areaData[pid]['cities'][cid]['districts'][id];
				$scope.popover.hide();
				return true;
			}
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'][id]['districts'];
				if ($scope.areaList.length <= 0) {
					$scope.userInfo.area = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + "其他（县/区）";
					$scope.popover.hide();
				}
				return true;
			}
			if (id.substr(0, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'];
				return true;
			}
		};
		//获取地址列表
		function getInfo() {
			Mc.getUserAddress(function (response) {
				Message.hidden();
				if (response.code == 0) {
					$scope.pageInfo = response;
					$scope.defaultAddredd = response.data;
				} else {
					$scope.pageInfo = response;
				}
			}, function (error) {
				Message.show(error.message);
			});
		}
		//提交
		$scope.addresSubmit = function(){
			var _s = $scope.userInfo;
			Mc.addAddress(function (response) {
				Message.show(response.msg);
				if (response.code == 301) {
					_s.name = '';
					_s.mobile = '';
					_s.infoAddress = '';
					_s.area = '';
					_s.sex=1;
					$scope._type = 0;
					$state.go('user.address',{'goodsInfo': $stateParams.goodsInfo, type: $stateParams.type})
				}
			}, function (error) {
				Message.show(error.message);
			}, _s, $scope._type, $scope._id)
		}
	})

	.controller('GoodsCollCtrl', function ($scope, $stateParams) {

	})

	.controller('StoreCollCtrl', function ($scope, $stateParams,Message,Mc,$state,Home,$timeout,$ionicLoading, User) {
		$scope.type = $stateParams.type;
		$scope.colllist = '';
		$scope.moreGoods = '';
		$scope.orderEmpty = false;
		//获取数据
		Mc.getColl($scope.type,function(res){
			Message.hidden();
			if(res.code == 0){
				$scope.orderEmpty = false;
				$scope.colllist = res.data;
			}else if(res.code == 1){
				$scope.orderEmpty = true;
				Message.show(res.msg)
			}
		},function(res){
			Message.show(res.mgs)
		});

		$scope.delTrack = function (id, $event, $index) {
			$event.stopPropagation();
			User.getCollectShops(function (response) {
				Message.show(response.msg, 1500);
				if (response.code == 0) {
					$scope.collect.list.splice($index, 1);
				}
			}, function () {
				Message.show('通信错误,请检查网络!', 1500);
			}, $scope.type, id, 'del');
		};
		$scope.selectType = function(type){
			if($scope.type == type){
				return;
			}
			$scope.noMore = true;
			$scope.page = 2;
			$scope.type = type;
			Mc.getColl($scope.type,function(res){
				Message.hidden();
				if(res.code == 0){
					$scope.orderEmpty = false;
					$scope.colllist = res.data;
				}else if(res.code == 1){
					$scope.orderEmpty = true;
					Message.show(res.msg)
				}
			},function(res){
				Message.show(res.mgs)
			});
		};

		// 获取商品推荐
		Home.fetchMoreGoods(function (response) {
			if(response.code == 0){
				$scope.moreGoods = response.data;
			}else if(response.code == 1){
				Message.show(response.msg);
			}
		});

		//下拉刷新
		$scope.doRefresh = function () {
			Mc.getColl($scope.type,function(res){
				Message.hidden();
				$scope.colllist = res.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.page = 2;
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				}, 1500);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			},function(res){
				Message.show(res.mgs)
			});
		};

		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Mc.getColl($scope.type,function(res){
				Message.hidden();
				if(res.code == 0){
					$scope.page++;
					$scope.colllist.list = $scope.colllist.list.concat(res.data.list);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1500);
				}else if(res.code == 1){
					$scope.noMore = false;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多了！',
						duration: '1200'
					});
				}
			},function(res){
				Message.show(res.mgs)
			},$scope.page);

		};
	})

	.controller('FootprintCtrl', function ($scope, $stateParams,Message,Mc,$state,Home,$timeout,$ionicLoading,User) {
		$scope.footlist = '';

		//获取数据
		Mc.getfoot(function(res){
			Message.hidden();
			if(res.code == 0){
				$scope.footlist = res.data;
			}else if(res.code == 1){
				$scope.footlist = res.data;
				Message.show(res.msg);
			}
		},function(res){});

		//清除
		$scope.clearfoot = function(id){
			User.getCollectShops(function(res){
				Message.hidden();
				if(res.code == 0){
					Message.show(res.msg);
					Mc.getfoot(function(res){
						Message.hidden();
						if(res.code == 0){
							$scope.footlist = res.data;
						}else if(res.code == 1){
							$scope.footlist = res.data;
							Message.show(res.msg);
						}
					},function(res){});
				}else if(res.code == 1){
					Message.show(res.msg)
				}
			},function(res){},'click',id,'del');
		};

		//下拉刷新
		$scope.doRefresh = function () {
			Mc.getfoot(function(res){
				Message.hidden();
				$scope.footlist = res.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.page = 2;
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				}, 1500);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			},function(res){
				Message.show(res.mgs)
			});
		};

		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Mc.getfoot(function(res){
				Message.hidden();
				if(res.code == 0){
					$scope.page++;
					$scope.footlist.list = $scope.footlist.list.concat(res.data.list);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1500);
				}else if(res.code == 1){
					$scope.noMore = false;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多了！',
						duration: '1200'
					});
				}
			},function(res){
				Message.show(res.mgs)
			},$scope.page);

		};

	})

	.controller('PaySuccessCtrl', function ($scope, Home, $stateParams, $state) {
		$scope.type = $stateParams.type;
// 获取商品推荐
		$scope.goodsShow = false;
		Home.fetchMoreGoods(function (response) {
			if(response.code == 0){
				$scope.moreGoods = response.data;
				$scope.goodsShow = true;
			}else if(response.code == 1){
				$scope.goodsShow = false;
			}
		});
		$scope.toUrl = function () {
			if($scope.type == 'offline') {
				$state.go('shop.offOrderList',{type: 'user'})
			}else{
				$state.go('mall.order',{status: '0'});
			}

		}

	})

	.controller('LovelifeCtrl', function ($scope, $stateParams) {

	})

	.controller('FoundStoreCtrl', function ($scope, $stateParams) {

	})

	.controller('SignCtrl', function ($scope, $stateParams) {

	})

	.controller('ManagementCtrl', function ($scope, $stateParams,$ionicActionSheet,User,$ionicHistory,$ionicLoading,$timeout,$state) {
// 退出登录
		$scope.logout = function () {
			$ionicActionSheet.show({
				destructiveText: '退出登录',
				titleText: '确定退出当前登录账号么？',
				cancelText: '取消',
				cancel: function () {
					return true;
				},
				destructiveButtonClicked: function () {
					User.logout();
					$ionicHistory.nextViewOptions({    //退出后清除导航的返回
						disableBack: true
					});
					$ionicLoading.show({
						noBackdrop: true,
						template: '退出成功！',
						duration: '1500'
					});
					$timeout(function () {
						$ionicHistory.clearCache().then((function() {//清除缓存
							return $state.go('auth.login')
						}))
					}, 1200);
					return true;
				}
			});
		};
	})

	.controller('PersonInfoCtrl', function ($scope, $stateParams,$cordovaCamera,$ionicActionSheet,Message,User,$timeout,$state) {
		var _img = '';
		$scope.userInfo = {};
		User.saveAvatar(function (res) {  	///获取信息
			Message.hidden();
			if(res.code == 0){
				$scope.userInfo = res.data;
				if($scope.userInfo.user.gender == 0){
					$scope.userInfo.user.gender = 1;
				};
				if(!$scope.userInfo.user.nickname){
					$scope.userInfo.user.nickname = '未设置';
				}
			}else if(res.code == 1){
				Message.show(res.msg)
			}
		});
		$scope.selectGender = function(type){	//选择性别
			$scope.userInfo.user.gender = type;
		}
		$scope.clearname = function(){
			$scope.userInfo.user.nickname = '';
		}

		// 头像选择 显示操作表
		var selectImages = function (from) {
			var options = {
				quality: 85,
				destinationType: Camera.DestinationType.DATA_URL,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				allowEdit: false,
				encodingType: Camera.EncodingType.JPEG,
				targetWidth: 200,
				targetHeight: 200,
				correctOrientation: true,
				cameraDirection: 0
			};
			if (from == 'camera') {
				options.sourceType = Camera.PictureSourceType.CAMERA;
			}
			document.addEventListener("deviceready", function () {
				$cordovaCamera.getPicture(options).then(function (imageURI) {
					_img = imageURI;
					$scope.userInfo.user.avatar = "data:image/jpeg;base64," + imageURI;
					var image = document.getElementById('myImage');
					image.src = $scope.userInfo.user.avatar;
				}, function (error) {
					console.log(error);
				});
			}, false);
		};
		// 弹出选择图片
		$scope.uploadAvatar = function () {
			var buttons = [];
			if (ionic.Platform.isAndroid()) {
				buttons = [
					{text: "<i class='ion-android-camera t_shopsDetails_tableIcon'></i>拍一张照片"},
					{text: "<i class='ion-android-image t_shopsDetails_tableIcon'></i>从相册选一张"}
				]
			} else {
				buttons = [
					{text: "拍一张照片"},
					{text: "从相册选一张"}
				]
			}
			$ionicActionSheet.show({
				buttons: buttons,
				titleText: '请选择',
				cancelText: '取消',
				buttonClicked: function (index) {
					if (index == 0) {
						selectImages("camera");
					} else if (index == 1) {
						selectImages();
					}
					return true;
				}
			})
		};
		//保存修改
		$scope.personSubmit = function(){
			if(!$scope.userInfo.user.nickname){
				Message.show('昵称不能为空');
				return;
			}
			User.saveAvatar(function (res) {
				Message.hidden();
				if(res.code == 0){
					Message.show(res.msg);
					$timeout(function () {
						$state.go('user.management');
					}, 1000);
				}else if(res.code == 1){
					Message.show(res.msg)
				}
			},function(){},$scope.userInfo.user,'save');
		}

	})
	.controller('centerCtrl', function ($scope, Shop, $rootScope) {
		$scope.shopsInfo = {};
		// Shop.getShops($rootScope.globalInfo.user.isShop).then(function (data) {
		// 	$scope.shopsInfo = data;
		// })
	})

	.controller('applyforCtrl', function ($scope, $state,Shop,$timeout, $rootScope,$ionicPopover,$ionicScrollDelegate,Mc,Area,Message,$cordovaCamera,$ionicActionSheet) {
		$scope.applyInfo = {};
		$scope.title='';
		$scope.shopType = {};
		Shop.applyfor(function(res){
			Message.hidden();
			if(res.code == 0){
				$scope.shopTypeInfo = res.data
			}else{
				Message.show(res.msg)
			}

		},function(){});
		$scope.applyshow = function(title){
			// if(!$scope.shopType.cid&&title == 'shopType'){
			// 	Message.show('请先选择分类');
			// 	return;
			// }
			$scope.title = title;
			$scope.applyPopover.show();
			if(title == 'cid'){
				Shop.applyfor(function(res){
					Message.hidden();
					if(res.code == 0){
						$scope.shopTypeInfo = res.data.shopTypeInfo;
					}else if(res.code == 1){
						Message.show(res.msg)
					}
				},function(){});
			}
		};
		//选择分类
		$scope.selectType = function(x,y){
			$scope.applyPopover.hide();
			if($scope.title == 'cid'){
				$scope.applyInfo.cid = x;
				$scope.shopType[$scope.title] = y;
				Shop.applyfor(function(res){
					Message.hidden();
					if(res.code == 0){
						$scope.shopTypeInfo = res.data;
					}else if(res.code == 1){
						Message.show(res.msg)
					}
				},function(){},x,'select');
			}else{
				$scope.applyInfo.shopType = y.id;
				$scope.shopType[$scope.title] = y.title;
			}
		};

		//申请成为商家
		$scope.applySubmit = function(){
			Message.hidden();
			Shop.applyfor(function(res){
				if(res.code == 0){
					$state.go('tab.my');
					$timeout(function(){
						Message.show(res.msg);
					},500)
				}else if(res.code == 1){
					Message.show(res.msg)
				}else if(res.code == 302){
					Message.show(res.msg);
					$timeout(function(){

					},1000)
				}
			},function(){},$scope.applyInfo,'save');
		};
		// 头像选择 显示操作表
		var selectImages = function (from,type) {
			var options = {
				quality: 85,
				destinationType: Camera.DestinationType.DATA_URL,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				allowEdit: false,
				encodingType: Camera.EncodingType.JPEG,
				targetWidth: 200,
				targetHeight: 200,
				correctOrientation: true,
				cameraDirection: 0
			};
			if (from == 'camera') {
				options.sourceType = Camera.PictureSourceType.CAMERA;
			}
			document.addEventListener("deviceready", function () {
				$cordovaCamera.getPicture(options).then(function (imageURI) {
					_img = imageURI;
					if(from == 'camera'){
						$scope.applyInfo[type] = "data:image/jpeg;base64," + imageURI;
					}else{
						$scope.applyInfo[from] = "data:image/jpeg;base64," + imageURI;
					}
					// image.src = $scope.userInfo.user.avatar;
				}, function (error) {
					console.log(error);
				});
			}, false);
		};
		// 弹出选择图片
		$scope.uploadAvatar = function (type) {
			var buttons = [];
			if (ionic.Platform.isAndroid()) {
				buttons = [
					{text: "<i class='ion-android-camera t_shopsDetails_tableIcon'></i>拍一张照片"},
					{text: "<i class='ion-android-image t_shopsDetails_tableIcon'></i>从相册选一张"}
				]
			} else {
				buttons = [
					{text: "拍一张照片"},
					{text: "从相册选一张"}
				]
			}
			$ionicActionSheet.show({
				buttons: buttons,
				titleText: '请选择',
				cancelText: '取消',
				buttonClicked: function (index) {
					if (index == 0) {
						selectImages("camera",type);
					} else if (index == 1) {
						selectImages(type);
					}
					return true;
				}
			})
		};
		// 筛选遮罩层
		$ionicPopover.fromTemplateUrl('templates/user/address-popover.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});
		$ionicPopover.fromTemplateUrl('templates/user/apply-popover.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.applyPopover = popover;
		});

		// 筛选
		$scope.areaShow = function () {
			Area.getList(function (data) {
				$scope.areaList = $scope.areaData = data;
			});
			$scope.popover.show();
		};
		//选择地址
		$scope.selectArea = function (id) {
			$ionicScrollDelegate.scrollTop();
			var pid = id.substr(0, 2) + "0000";
			var cid = id.substr(0, 4) + "00";
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00" && id.substr(4, 2) != "00") {
				$scope.applyInfo.birth = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + $scope.areaData[pid]['cities'][cid]['districts'][id];
				$scope.popover.hide();
				return true;
			}
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'][id]['districts'];
				if ($scope.areaList.length <= 0) {
					$scope.applyInfo.birth = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + "其他（县/区）";
					$scope.popover.hide();
				}
				return true;
			}
			if (id.substr(0, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'];
				return true;
			}
		};
	})

	.controller('CertificationCtrl', function ($scope, NameBankAlipy,Message,$stateParams) {
		$scope.real = {name:'',idcard:''};

		//获取信息
		NameBankAlipy.getrealname(function(res){
			if(res.code == 0){
				$scope.real.name = res.data.realname;
				$scope.real.idcard = res.data.idcard;
			}
		});


		//修改提交
		$scope.submit = function(){
			if(!$scope.real.name){
				Message.show('请填写姓名');
				return;
			}
			if(!$scope.real.idcard){
				Message.show('请填写身份证号');
				return;
			}
			NameBankAlipy.setrealname(function(res){
				if(res.code == 0){
					Message.show(res.msg)
				}else if(res.code == 1){
					Message.show(res.msg)
				}
			},function(res){},$scope.real)
		};
	})

	.controller('BalanceCtrl', function ($scope, Mc, Message) {
		$scope.pageInfo = {};
		//获取数据
		Mc.getUserInfo(function (response) {
			Message.hidden();
			$scope.pageInfo = response.data;
			// console.log($scope.pageInfo)
		}, function (error) {
			Message.show(error.message);
		});
	})

	.controller('CouponCtrl', function ($scope, $stateParams) {

	})

	.controller('ModifyPsdCtrl', function ($scope, $stateParams,User,Message,$state,$interval,$rootScope, $timeout) {
		$scope.getCaptchaSuccess = false;
		$scope.type = $stateParams.type;
		$scope.pageData = {mobile:'', newpsd: '', respsd: ''};
		$scope.reg= {
			number: 60,
			bol: false
		};
		$scope.pageData.mobile = $rootScope.globalInfo.data.mobile;
		// 修改登录验证码
		$scope.savePsd = function(){
			if($scope.type == 1){
				if($scope.pageData.oldpsd.length< 6){
					Message.show('请输入至少6位的密码');
					return;
				}
			}

			if($scope.pageData.newpsd.length< 6 || $scope.pageData.respsd.length< 6){
				Message.show('请输入至少6位的密码');
				return;
			}
			if($scope.pageData.newpsd != $scope.pageData.respsd){
				Message.show('两次密码不一致');
				return;
			}
			if($scope.type == 1){
				User.updatapswcode($scope.pageData).then(function () {
					User.logout(1);
				})
			}else if($scope.type == 2){
				User.setPayPassword('save',$scope.pageData).then(function (res) {
					if(res.code == 0){
						Message.show(res.msg);
						$timeout(function () {
							$state.go('user.management')
						},1200)
					}else if(res.code == 1){
						Message.show(res.msg)
					}
				})
			}

		};
		// $scope.getCaptcha = function () {
		// 	if($scope.pageData.newpsd.length< 6 || $scope.pageData.respsd.length< 6){
		// 		Message.show('请输入至少6位的密码');
		// 		return;
		// 	}
		// 	if($scope.pageData.newpsd != $scope.pageData.respsd){
		// 		Message.show('两次密码不一致');
		// 		return;
		// 	}
		// 	User.setPayPassword('code').then(function (response) {
		// 		if (response.code !== 0) {
		// 			Message.show(response.msg);
		// 			return false;
		// 		}
		// 		$rootScope.$broadcast('Captcha.send');
		// 		Message.show(response.msg, 1000);
		// 	});
		// };
		//发送验证后倒计时
		// $scope.$on("Captcha.send", function () {
		// 	$scope.reg.bol = true;
		// 	$scope.reg.number = 60;
		// 	var timer = $interval(function () {
		// 		if ($scope.reg.number <= 1) {
		// 			$interval.cancel(timer);
		// 			$scope.reg.bol = false;
		// 			$scope.reg.number = 60;
		// 		} else {
		// 			$scope.reg.number--;
		// 		}
		// 	}, 1000)
		// });
	})

	// 关于我们
	.controller('userAboutUsCtrl', function ($scope, System, Message) {
		System.aboutUs(function(response){
			Message.hidden();
			$scope.version = response.data;
		},function(err){
			Message.show(err.msg);
		});
		$scope.getUpdate = function(){
			System.checkUpdate().then(function () {
				Message.show("已经是最新版本！", 1200);
			});
		};
	})

	.controller('BindAccountCtrl', function ($scope, $stateParams) {

	})

	.controller('SearchCtrl', function ($scope, $stateParams, List) {
		$scope.type = $stateParams.type;
		$scope.spid = $stateParams.spid;
		List.getSearchHotInfo($stateParams.type).then(function (data) {
			$scope.info = data
		});
		$scope.search = function (searchType, keywords) {
			List.search(searchType, keywords, $scope.spid);
		};
	})

	.controller('EvaluateCtrl', function ($scope, $stateParams, $ionicHistory, $ionicActionSheet, $cordovaCamera, Order, Message, $timeout, $state) {
		var orderSn = $stateParams.orderSn;
		$scope.form = {};
		// 获取子订单详情
		Order.getDetail(orderSn, function(response) {
			Message.hidden();
			if (response.code === 0) {
				$scope.order = response.data.order;
				$scope.orderInfo = response.data.orderInfo;

				// 生成默认好评
				angular.forEach($scope.orderInfo, function(items) {
					angular.forEach(items.goods, function(item) {
						$scope.form[item.goodsId] = {};
						$scope.form[item.goodsId]['score'] = 3;
						$scope.form[item.goodsId]['thumbs'] = [];
					})
				})
			} else {
				Message.show(response.msg);
			}
		}, function(response){
			Message.show(response.msg);
		});

		// 设置默认五星好评
		$scope.form['star'] = {
			desc: 5,
			express: 5,
			serve: 5
		};
		$scope.setStar = function(type, i) {
			$scope.form['star'][type] = i;
		};



		// 图片选择 显示操作表
		var selectImages = function (id, from) {
			// TODO APP端打开
			var options = {
				quality: 85,
				destinationType: Camera.DestinationType.DATA_URL,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				allowEdit: false,
				encodingType: Camera.EncodingType.JPEG,
				targetWidth: 200,
				targetHeight: 200,
				correctOrientation: true,
				cameraDirection: 0
			};
			if (from === 'camera') {
				options.sourceType = Camera.PictureSourceType.CAMERA;
			}
			document.addEventListener("deviceready", function () {
				$cordovaCamera.getPicture(options).then(function (imageData) {
					$scope.form[id]['thumbs'].push("data:image/jpeg;base64," + imageData);
				}, function (error) {
					console.log(error);
				});
			}, false);
		};
		$scope.uploadImg = function(id) {
			var buttons = [];
			if (ionic.Platform.isAndroid()) {
				buttons = [
					{text: "<i class='ion-android-camera t_shopsDetails_tableIcon'></i>拍一张照片"},
					{text: "<i class='ion-android-image t_shopsDetails_tableIcon'></i>从相册选一张"}
				]
			} else {
				buttons = [
					{text: "拍一张照片"},
					{text: "从相册选一张"}
				]
			}
			$ionicActionSheet.show({
				buttons: buttons,
				titleText: '请选择',
				cancelText: '取消',
				buttonClicked: function (index) {
					if (index === 0) {
						selectImages(id, "camera");
					} else if (index === 1) {
						selectImages(id);
					}
					return true;
				}
			})
		};

		$scope.submit = function() {
			Order.evaluate(orderSn, $scope.form, function(response) {
				if (response.code === 0) {
					$state.go('mall.order',{status:4});
					$timeout(function () {
						Message.show(response.msg);
					},1200);
					// $ionicHistory.goBack();
				} else {
					Message.show(response.msg);
				}
			}, function(response) {
				console.log(response);
			})
		};
	})

	.controller('myBalanceCtrl',  function ($scope, Message, $state, $stateParams, Credit, Payment, $rootScope, Shop, $ionicLoading, $ionicModal, $cordovaInAppBrowser){
		$scope.balanceInfo = {credit2: '', remoney: ''};
		$scope.type = $stateParams.type;
		// 选择支付类型
		$scope.payType = 'hxpay';
		$scope.selectPayType = function (type) {
			$scope.payType = type;
		};
		if($scope.type == 'shop'){
			Shop.getShopsCredit2($rootScope.globalInfo.user.isShop).then(function (response) {
				if(response.code == 0){
					$scope.balanceInfo = response.data;
				}else if(response.code == 1){
					Message.show(response.msg)
				}
			});
		}

		var commonData = '';
		commonData = Credit.getRecharge;
		$scope.payment = function (payType) {
			if(!$scope.balanceInfo.remoney){
				Message.show('请输入充值金额');
				return false;
			}

			commonData($scope.balanceInfo.remoney,payType).then(function (response) {
				if(response.code == 0){
					if(payType == 'hxpay'){
						Payment.hxpay(response.data.orderId).then(function (response) {
							if(response.code == 0){
								// $scope.payInfo = response.data;
								document.addEventListener("deviceready", function () {
									var options = {
										location: 'yes',
										clearcache: 'yes',
										toolbar: 'yes',
										toolbarposition: 'top'

									};
									$cordovaInAppBrowser.open(response.data.httpUrl, '_self', options)
										.then(function(event) {
											console.log(event)
										})
										.catch(function(event) {
											// error
											console.log(event)
										});
								}, false);
							}else if(response.code == 1){
								Message.show(response.msg)
							}
						})
					}
				}else if(response.code == 1){
					Message.show(response.msg)
				}
			});
		};
	})

	.controller('UserCreditCtrl', function ($scope, $stateParams, User, Message, $timeout) {
		$scope.myVar = true;
		$scope.credit = {};

		/*上拉下拉的基本参数*/
		$scope.loadMoreBol = true;
		$scope.page = 2;

		$scope.toggle = function () {
			$scope.myVar = !$scope.myVar;
		};

		function getList(num) {
			User.getCredit(function (response) {
				Message.hidden();
				if (num) {//加载更多
					$scope.loadMoreBol = false;
					$scope.$broadcast('scroll.infiniteScrollComplete');
					if (response.code == 0) {
						$scope.credit.list = $scope.credit.list.concat(response.data.list);
						$scope.page++;
						$timeout(function () {
							$scope.loadMoreBol = true;
						}, 500)
					} else {
						Message.show('没有更多了', 1500);
					}
				} else {//刷新
					$scope.refreshing = true; //下拉加载时避免上拉触发
					$scope.loadMoreBol = true;
					$scope.$broadcast('scroll.refreshComplete');
					$scope.page = 2;
					$timeout(function () {
						$scope.refreshing = false;
					}, 1000);
					$scope.credit = response.data;
				}

			}, function () {
				Message.show('通信错误,请检查网络!', 1000);
			}, $stateParams.type, num ? $scope.page : 0);
		}

		getList();
		// 加载更多
		$scope.loadMore = function () {
			getList(1);
		};
		// 下拉刷新
		$scope.reload = function () {
			getList();
		};
	})

	.controller('creditWithdrawCtrl', function ($scope, $stateParams, User, Message, $timeout, $state) {
		$scope.giveMoney = {};
		User.toMoney(function(response){
			Message.hidden();
			if(response.code == 0){
				$scope.giveMoney = response.data;
			}
			if(response.code == 301){
				Message.show(response.msg);
				return false;
			}

		},function(error){
			Message.show(error.msg);
		});
		$scope.tiXian = function(money){
			if(!money){
				Message.show('请输入您的提现金额！');
				return false;
			}
			if(money > $scope.giveMoney){
				Message.show('您的提现金额超出了总提现额度！');
				return false;
			}
			User.huoMoney(function(response){
				Message.hidden();
				if(response.code == 0){
					Message.show('提现申请提交成功！');
					$timeout(function () {
						$state.go('user.cWithdrawList');
					}, 1500)
				}else if(response.code == 1){
					Message.show(response.msg);
				}
			},function(error){
				Message.show(error.msg);
			}, money)
		}
	})

	.controller('UserOrderCtrl', function ($scope, $http, $ionicScrollDelegate, $stateParams, User, Message, $timeout, $state, Payment, $ionicPopup, $rootScope, Storage, $ionicLoading) {
		$scope.getOrderList = [];
		$scope.loadMoreBol = true;
		$scope.status = $stateParams.status;
		$scope.page = 2;
		$scope.orderEmpty = false;
		$scope.$on('$ionicView.beforeEnter', function () {
			$rootScope.href = window.location.href;
			Storage.set("href", $rootScope.href);
			if (!User.checkAuth()) {
				$scope.checkAuth = false;
			}else{
				$scope.checkAuth = true;
			}
		});
		$scope.isLogin = function (num) {
			$scope.isShowBtm = false;
			$ionicScrollDelegate.scrollTop();
			$scope.status = num;
			$scope.page = 2;
			getList();
			$scope.noMore = true;
		};
		function getList() {
			User.getOrderList('get',$scope.status).then(function (response) {
				if(response.code == 0){
					$scope.orderEmpty = false;
					$scope.orderList = response.data;
					$scope.getOrderList = response.data.orderList;
					$scope.getOrderStatus = response.data.orderStatus;
				}else if(response.code == 1){
					$scope.orderEmpty = true;
				}
			},function () {
				Message.show('通信错误,请检查网络!', 1000);
			});
		}

		getList();

		// 确认收货
		$scope.confirmGoods = function (orderId) {
			User.cancelOrder(function (response) {
				if (response.code == 1) {
					Message.show(response.msg);
					return false;
				} else {
					getList();
					$timeout(function () {
						Message.show('确认收货成功，赶快去评论吧~');
					}, 1000)
				}
			}, function (error) {
				Message.show(error.message)
			}, orderId, 'confirm')
		}
		$scope.isShowBtm = false;
		// 下拉刷新
		$scope.reload = function () {
			User.getOrderList($scope.status).then(function (response) {
				$scope.isShowBtm = false;
				$scope.orderList = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				}, 1500);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
				$scope.page = 2;
			});
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.getOrderList('load',$scope.status, $scope.page).then(function (response) {
				if (response.code != 0) {
					$scope.noMore = false;
					$scope.isShowBtm = true;
				}else{
					$scope.page++;
					$scope.getOrderList = $scope.getOrderList.concat(response.data.orderList);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.isShowBtm = false;
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1500);
				}

			});
		};

		// 取消订单
		$scope.cancel = function (orderId, pas) {
			User.cancelOrder(function (response) {
				if (response.code == 1) {
					Message.show(response.msg);
					return false;
				} else {
					getList();
					Message.show(response.msg);
				}
			}, function (error) {
				Message.show(error.message)
			}, orderId, 'cancel')
		};
		// 删除订单
		$scope.delete = function (orderId, pas) {
			User.cancelOrder(function (response) {
				if (response.code == 1) {
					Message.show(response.msg);
					return false;
				} else {
					getList();
					Message.show(response.msg);
				}
			}, function (error) {
				Message.show(error.message)
			}, orderId, 'delete')
		};
		var model = 'bbc';
		var order = 'order';
		// 立即支付
		$scope.payment = function (payType, orderId) {
			if (payType == 'wechat') {
				if (!window.Wechat) {
					alert("暂不支持微信支付！");
					return false;
				}
				Payment.wechatPay(model, orderId, 'order');

			} else if (payType == 'alipay') {
				Payment.alipay(model, orderId, 'order');

			} else if (payType == 'credit') {

				$ionicPopup.confirm({
					title: '余额支付',
					template: '确定支付吗？',
					buttons: [
						{
							text: '取消', onTap: function () {
							return false;
						}
						},
						{
							text: '确定', type: 'button-assertive', onTap: function () {
								Payment.creditPay(function (response) {
									if (response.code == 0) {
										$http.post(response.data);
										getList();
										Message.show('支付成功', 2000);
									}
								}, function () {

								}, orderId, 'order');
							}
						}
					]
				})
			}
		}
	})

	.controller('OrderDetailsCtrl', function ($scope, $stateParams, $http, User, $ionicLoading, Message, $state, Payment, $timeout, $ionicPopup, Home) {
		$scope.orderList = {};
		$scope.listDetail = {};
		$scope.listOrder = {};
		$scope.cashback = {};
		$scope.payTitle = '';
		$scope.payType ='';
		$scope.orderSn = $stateParams.orderSn;
		saveOrderDetail();
		function saveOrderDetail(){
			User.getOrderListDetail(function (response) {
				Message.hidden();
				$scope.orderList = response.data;
				$scope.listDetail = response.data.orderInfo;
				$scope.listOrder = response.data.order;
				$scope.cashback = response.data.cashback;
			}, function (error) {
				Message.show(error.message);
			}, $scope.orderSn);
		}

		// 选择支付
		$scope.bol = true;
		$scope.toggle = function () {
			$scope.bol = !$scope.bol
		}
		$scope.selectType = function (type,name) {
			$scope.listOrder.payType = type;
			$scope.payTitle = name
		}

		// 取消订单
		$scope.cancel = function (orderId, pas) {
			User.cancelOrder(function (response) {
				if (response.code == 1) {
					Message.show(response.msg);
					return false;
				} else {
					Message.show(response.msg);
					$timeout(function () {
						$state.go('mall.order',{status: 0})
					},1000)

				}
			}, function (error) {
				Message.show(error.message)
			}, orderId, 'cancel')
		}
		// 删除订单
		$scope.delete = function (orderId, pas) {
			User.cancelOrder(function (response) {
				if (response.code == 1) {
					Message.show(response.msg);
					return false;
				} else {
					Message.show(response.msg);
					$timeout(function () {
						$state.go('mall.order',{status: 0})
					},1000)
				}
			}, function (error) {
				Message.show(error.message)
			}, orderId, 'delete')
		}
		$scope.goodsShow = false;
		Home.fetchMoreGoods(function (response) {
			if(response.code == 0){
				$scope.moreGoods = response.data;
				$scope.goodsShow = true;
			}else if(response.code == 1){
				$scope.goodsShow = false;
			}
		});
		// 取消退货
		$scope.cancleReturnGoods = function (orderSn) {
			$ionicPopup.confirm({
				title: '取消退货',
				template: '确定取消退货吗？',
				buttons: [
					{
						text: '取消', onTap: function () {
						return false;
					}
					},
					{
						text: '确定', type: 'button-assertive', onTap: function () {
						User.cancelReturnGoods(orderSn).then(function (response) {
							if (response.code == 0) {
								$timeout(function () {
									Message.show(response.msg)
								},1500);
								getList();
							}else if(response.code == 1){
								Message.show(response.msg)
							}
						});
					}
					}
				]
			})
		};
		// 确认收货
		$scope.confirmGoods = function (orderId) {
			User.cancelOrder(function (response) {
				if (response.code == 1) {
					Message.show(response.msg);
					return false;
				} else {
					saveOrderDetail();
					$timeout(function () {
						Message.show('确认收货成功，赶快去评论吧~');
					},1200)
				}
			}, function (error) {
				Message.show(error.message)
			}, orderId, 'confirm')
		};
		var model = 'bbc';
		// 立即支付
		$scope.payment = function (payType, orderId) {
			if (payType == 'wechat') {
				if (!window.Wechat) {
					alert("暂不支持微信支付！");
					return false;
				}
				Payment.wechatPay(model, orderId, 'order');

			} else if (payType == 'alipay') {
				alert("证书尚未配置，请用微信支付！");
				if (checkoutPara) {

				} else {

				}

			} else if (payType == 'credit') {
				// $state.go("payment.credit");
				Payment.creditPay(function (response) {
					if (response.code == 0) {
						$ionicPopup.confirm({
							title: '余额支付',
							template: '确定支付吗？',
							buttons: [
								{
									text: '取消', onTap: function () {
									return false;
								}
								},
								{
									text: '确定', type: 'button-assertive', onTap: function () {
									return true;
								}
								}
							]
						}).then(function(res) {
							if(res) {
								Message.show('支付成功', 1500);
								$http.post(response.data);
								$timeout(function () {
									$state.go('tab.order');
								}, 1500)
							} else {

							}
						});
					} else {
						Message.show(response.msg, 1500);
					}
				}, function (error) {
					alert('出错啦');
				},orderId, 'order');
			}

		}
	})

	.controller('returnGoodsCtrl', function ($scope, $stateParams, User, Message, $state) {
		$scope.orderId = $stateParams.orderId;
		$scope.payPrice = $stateParams.payPrice;
		// 退货申请
		$scope.applyReturnGoods = function (orderId, goodsInfo) {
			if (!goodsInfo) {
				Message.show('请填写退款原因！');
				return false;
			}
			User.returnGoods(function (response) {
			}, function () {
			}, $scope.orderId, goodsInfo)
		}
	})

	.controller('UserAgentCtrl', function ($scope, $stateParams, $state, User, Message, $timeout) {
		$scope.agent = {};
		User.getAgent(function (response) {
			if (response.code != 0) {
				Message.show(response.msg);
				$timeout(function () {
					$state.go('tab.my');
				}, 1500)
			}
			$scope.agent = response.data;

		}, function (error) {
			Message.show(error.message)
		})
	})



	.controller('UserAgentListCtrl', function ($scope, $stateParams, User, Message) {
		$scope.myVar = true;
		$scope.agentList = {};
		$scope.toggle = function () {
			$scope.myVar = !$scope.myVar
		};
		saveAgent();
		$scope.agentListDet = function(type){
			saveAgent(type);
			$scope.myVar = !$scope.myVar
		}
		function saveAgent(type) {
			User.getAgentList(function (response) {
				$scope.agentList = response.data;
			}, function (error) {
				Message.show(error.message);
			}, type);
		}

	})

	.controller('UserTeamCtrl', function ($scope, $stateParams, User, Message, $state) {
		$scope.team = {};
		getTeam();
		function getTeam(level, uid) {
			User.getTeam(function (response) {
				// if (response.code != 0) {
				// 	Message.show(response.msg);
				// 	$state.go('user.agent');
				// }
				$scope.team = response.data;
			}, function (error) {
				Message.show(error.message)
			}, level, uid);
		}

		$scope.level = 1;
		$scope.active = function (level, uid) {
			$scope.level = level;
			getTeam(level, uid);
		}
	})

	.controller('UserWidthdrawCtrl', function ($scope, $stateParams, User, Message) {
		$scope.withdraw = {};
		User.userWithdraw(function (response) {
			$scope.withdraw = response.data;
			console.log($scope.withdraw.method[0].methodType)
		}, function (error) {
			Message.show(error.message);
		});
		$scope.info = {
			type: '',
			money: '',
			username: '',
			mobile: '',
			card: '',
			cardType: '',
			alipay: '',
			types: 'save'
		};

		function getWithdraw(pas) {
			User.userWithdrawSuccess(function (response) {
				$scope.withdraw = response.data;
			}, function (error) {
				Message.show(error.message)
			}, pas)
		}

		$scope.widthdrawSuccess = function (pas) {
			var pas = {
				type: $scope.info.paytype,
				money: $scope.info.money,
				username: $scope.info.username,
				mobile: $scope.info.mobile,
				card: $scope.info.card,
				cardType: $scope.info.cardType,
				alipay: $scope.info.alipay,
				types: 'save'
			};

			if (!$scope.info.paytype) {
				Message.show('请选择提现方式！');
				return false;
			}
			if (!$scope.info.money) {
				Message.show('请填写提现金额！');
				return false;
			}
			if (!$scope.info.username) {
				Message.show('请填写真实姓名！');
				return false;
			}
			if (!$scope.info.mobile) {
				Message.show('请填写联系电话！');
				return false;
			}
			if ($scope.info.paytype == 'bankCard' && !$scope.info.card) {
				Message.show('请填写银行卡号！');
				return false;
			}
			if ($scope.info.paytype == 'bankCard' && !$scope.info.cardType) {
				Message.show('请填写开户行！');
				return false;
			}
			if ($scope.info.paytype == 'aliPay' && !$scope.info.alipay) {
				Message.show('请填写支付宝账号！');
				return false;
			}
			getWithdraw(pas);
		}
	})

	.controller('UserWidwlistCtrl', function ($scope, $stateParams, User, Message) {
		$scope.withdrawList = {};
		User.userWithdrawList(function (response) {
			$scope.withdrawList = response.data;
		}, function (error) {
			Message.show(error.message)
		})
	})

	.controller('cWithdrawListCtrl', function ($scope, $stateParams, User, Message, $timeout, $ionicLoading){
		$scope.cList = {};
		User.toMoneyList().then(function (response) {
			Message.hidden();
			if(response.code == 0){
				$scope.cList = response.data
			}else if(response.code == 1){
				Message.show(response.msg);
			}
		});

		// 列表下拉刷新
		$scope.doRefresh = function () {
			User.toMoneyList().then(function (response) {
				$scope.noMore = false; //下拉加载时避免上拉触发
				$scope.cList = response.data;
				$timeout(function () {
					$scope.noMore = true;
				}, 1500);
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			});
		};
		// 下拉加载更多商家
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMoreGoods = function () {
			User.toMoneyList($scope.page).then(function (response) {
				$scope.page++;
				if(response.code == 0){
					$scope.cList = $scope.cList.concat(response.data);
					$scope.$broadcast('scroll.refreshComplete');
				}
				if(response.code != 0){
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
					$scope.noMore = false;
				}
			});
		};
	})

	.controller('creditAttornCtrl', function ($scope, $stateParams, User, Message, $timeout, $state) {
		$scope.data = {keys: ''};
		$scope.bol = true;
		$scope.creStatus = $stateParams.type;
		$scope.creditInfo = {nickname:'', uid:''};
		$scope.credit = {money: ''};
		$scope.searchThis = function () {
			if ($scope.data.keys == '') {
				Message.show('请输入用户编号！');
				return false;
			}
			$scope.bol = false;
			User.creditAttron(function (response) {
				Message.hidden();
				$scope.creditInfo = response.data;
			}, function (error) {
				Message.show(error.message);
			}, $scope.data.keys, $scope.creStatus)
		};
		$scope.subAttron = function(){
			if($scope.credit.money == ''){
				Message.show('请输入正确的转让数量！');
				return false;
			}
			User.offerAttron(function(response){
				if(response.code == 0){
					Message.show('转让成功！');
					if($scope.creStatus == 'credit2'){
						$timeout(function () {
							$state.go('user.credit',{type:'balance'})
						}, 1500);
					}else if($scope.creStatus == 'credit1'){
						$timeout(function () {
							$state.go('user.credit',{type:'point'})
						}, 1500);
					}

				}
				Message.show(response.msg);
			},function(error){
				Message.show(error.msg);
			},$scope.creditInfo, $scope.credit, $scope.creStatus)
		}
	})

	.controller('orderDiscussCtrl', function ($scope, $stateParams, User, Message, $state, $timeout) {
		$scope.data = {};
		$scope.data.info = '';
		$scope.thumb = $stateParams.thumb;
		$scope.orderSn = $stateParams.orderSn;
		$scope.addBiscuss = function () {
			if ($scope.data.info == '') {
				Message.show('请填写评论内容！');
				return false;
			}
			User.orderDiscuss(function (response) {
				if (response.code != 0) {
					Message.show(response.msg);
					$state.go('tab.home');
				}
			}, function () {
			}, $scope.orderSn, $scope.data.info)
		}
	})
	//我的足迹
	.controller('UserCollectCtrl', function ($scope, $stateParams, User, Message, $timeout) {
		$scope.selectype = $stateParams.type;
		$scope.collect = [];

		$scope.loadMoreBol = true;
		$scope.page = 2;

		selectShops();
		$scope.active = function (type) {
			if ($scope.selectype == type) {
				return false;
			}
			$scope.selectype = type;
			$scope.page = 2; //每次点击时把默认分页还原
			selectShops();
		};

		function selectShops(num) {
			User.getCollectShops(function (response) {
				Message.hidden();
				if (num) {
					$scope.loadMoreBol = false;
					$scope.$broadcast('scroll.infiniteScrollComplete');
					if (response.code == 0) {
						$scope.collect = $scope.collect.concat(response.data);
						$scope.page++;
						$timeout(function () {
							$scope.loadMoreBol = true;
						}, 500)
					} else {
						Message.show('没有更多了', 1500);
					}
				} else {
					$scope.refreshing = true; //下拉加载时避免上拉触发
					$scope.loadMoreBol = true;
					$scope.$broadcast('scroll.refreshComplete');
					$scope.page = 2;
					$timeout(function () {
						$scope.refreshing = false;
					}, 1000);
					$scope.collect = response.data;
				}
			}, function () {
				Message.show('通信错误,请检查网络!', 1000);
			}, $scope.selectype, 1, 0, num ? $scope.page : 0);//为了传page填写了两个没用的参数 1 1
		}


		$scope.delTrack = function (id, $event, $index) {
			$event.stopPropagation();
			User.getCollectShops(function (response) {
				Message.show(response.msg, 1500);
				if (response.code == 0) {
					$scope.collect.list.splice($index, 1);
				}
			}, function () {
				Message.show('通信错误,请检查网络!', 1500);
			}, $scope.selectype, id, 'del');
		};

		$scope.loadMore = function () {
			selectShops(1);
		};
		$scope.reload = function () {
			selectShops();
		};
	})

	.controller('UserRankingListCtrl', function ($scope, $stateParams, User, Message) {
		$scope.myVar = true;
		$scope.rankList = {};
		$scope.toggle = function () {
			$scope.myVar = !$scope.myVar;
		};
		saveranking();
		$scope.rankingListType = function (type) {
			saveranking(type);
			$scope.myVar = !$scope.myVar;
		}
		function saveranking(type){
			User.rankingList(function (response) {
				$scope.rankList = response.data;
			}, function (error) {
				Message.show(error.message)
			}, type)
		}
	})

	.controller('QRcodeCtrl', function ($scope, $stateParams, User, Message) {
		$scope.QRcode = {};
		User.getQRcode(function (response) {
			$scope.QRcode = response.data;
		}, function (error) {
			Message.show(error.message)
		})
	})

	.controller('redPageCtrl', function ($scope, $stateParams, User, Message) {
		$scope.redPage = {};
		User.redPage(function (response) {
			$scope.redPage = response.data;
		}, function (error) {
			Message.show(error.message)
		});
		$scope.warmPrompt = function (msg) {
			Message.show('商城开通了红包延迟功能，时间为：' + msg, 1500);
		}
	})

	.controller('messageCtrl', function ($scope, $stateParams, User, Message) {
		User.getMessage(function () {

		}, function (error) {
			Message.show(error.message)
		})
	})

	.controller('camiCtrl', function ($scope, $stateParams, Message, Mc) {
		$scope.bol = true;
		$scope.cami = {};
		$scope.camiList = {};
		Mc.getCami(function (response) {
			$scope.cami = response.data.cami;
			$scope.camiList = response.data.camilist;
		}, function (error) {
			Message.show(error.message)
		});
		$scope.camiDetail = function () {
			$scope.bol = !$scope.bol;

		}
	})

	.controller('CashbackCtrl', function ($scope, $stateParams, Message, User, $timeout, $ionicLoading) {
		$scope.cashList = {};
		$scope.orderEmpty = false;
		function brokerInfoData() {
			User.getMoreBack(function (response) {
				Message.hidden();
				$scope.cashList = response.data;
				if(response.code == 0){
					if(response.data.list == ''){
						$scope.orderEmpty = true;
					}else{
						$scope.orderEmpty = false
					}
				}else if(response.code == 1){
					$scope.orderEmpty = true
				}
			},function (error) {
				Message.show(error.message)
			});
		}
		brokerInfoData();
		$scope.cashReceive = function (id,pas) {
			User.getCashBack(function (response) {
				if(response.code == 0){
					$scope.cashList = response.data;
					brokerInfoData();
					$timeout(function () {
						Message.show(response.msg);
					},1200)
				}else if(response.code == 1){
					Message.show(response.msg);
					return false;
				}
			},function (error) {
				Message.show(error.message)
			}, id, pas);
		};

		$scope.bol = true;
		$scope.cashGuize = function () {
			$scope.bol = !$scope.bol;
		};
		// 列表下拉刷新
		$scope.doRefresh = function () {
			User.getMoreBack(function (response) {
				Message.hidden();
				$scope.noMore = false; //下拉加载时避免上拉触发
				$scope.cashList = response.data;
				$timeout(function () {
					$scope.noMore = true;
				}, 1500);
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			},function () {

			});
		};
		// 下拉加载更多商家
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.getMoreBack(function (response) {
				Message.hidden();
				console.log(response.data.list);
				if(response.code == 0){
					if(response.data.list == '' || !response.data.list){
						$ionicLoading.show({
							noBackdrop: true,
							template: '没有更多记录了！',
							duration: '1200'
						});
						$scope.noMore = false;
					}else{
						$scope.page++;
						$scope.cashList.list = $scope.cashList.list.concat(response.data.list);
						$scope.$broadcast('scroll.refreshComplete');
						$scope.noMore = false; //下拉加载时避免上拉触发
						$timeout(function () {
							$scope.noMore = true;
						}, 1500);
					}
				}
			},function () {

			},$scope.page);
		};
	})

	.controller('shopsCtrl', function ($scope, $stateParams, Shop, $ionicSlideBoxDelegate, $state, Message, Goods) {

		$scope.shop = {};
		$scope.spid = $stateParams.spid;
		$scope.isCare = 0;

		Shop.getShop(function (response) {
			$scope.shop = response.data;
			$scope.isCare = $scope.shop.isCare;

			if (response.code != 0) {
				$state.go('tab.home');
				Message.show(response.msg);
				return false;
			}
			// 获取幻灯
			$ionicSlideBoxDelegate.$getByHandle("slideimgs").loop(true);
			$ionicSlideBoxDelegate.update();
		}, function (error) {
			Message.show(error.message)
		}, $scope.spid, $scope.isCare);

		$scope.careShop = function () {
			Goods.shoucangShop(function (response) {
				if (response.code == 0) {
					if ($scope.isCare == 0) {
						$scope.isCare = 1;
					} else if ($scope.isCare != 0) {
						$scope.isCare = 0;
					}
				} else {
					Message.show(response.msg);
				}
			}, function (error) {
				Message.show(error.message)
			}, $scope.spid, 'spid');
		}
	})

	.controller('shopsDescribeCtrl', function ($scope, $stateParams, Shop, $ionicSlideBoxDelegate, $state, Message) {
		$scope.spid = $stateParams.spid;
		$scope.shopsDesc = {};
		Shop.shopsDesc(function (response) {
			Message.hidden();
			if(response.code == 0){
				$scope.shopsDesc = response.data;
			}else if(response.code == 1){
				Message.show(response.msg);
			}
		},function (error) {
			Message.show(error.message)
		}, $scope.spid);
	})

	.controller('payonLineCtrl', function ($scope, $http, $stateParams, Shop, $state, Message, Payment, $timeout, $ionicPopup) {
		var _json = {
			spid: $stateParams.spid
		};

		$scope.money = {};

		$scope.data = {};
		$scope.subBol = true;
		$scope.money.mm = '';
		$scope.money.zhekou = 0;
		$scope.money.mm2 = 0;

		$scope.showBol = false;
		$scope.showTypeTitle = "微信支付";
		$scope.showType = function ($event, title) {
			$event.stopPropagation();
			$scope.showBol = !$scope.showBol;
			if (title) {
				$scope.showTypeTitle = title;
			}
		};

		Shop.payonLine(function (response) {
			if (response.code == 0) {
				$scope.data = response.data;
				$scope.money.zhekou = (response.data.offlinePayDis / 100).toFixed(2);
			} else {
				Message.show(response.msg);
			}
		}, function () {
			Message.show('通信错误,请检查网络!', 1500);
		}, _json);

		$scope.$watch('money.mm', function (newValue, oldValue) {
			/*newValue ? newValue = newValue : newValue = 0;
			 $scope.money.mm = String(newValue);*/
			if (newValue - 0 && $scope.data.offlinePayDis > 0 && $scope.data.offlinePayDis < 100 && $scope.money.mm > 0) {
				$scope.subBol = false;
			} else {
				$scope.subBol = true;
			}
			$scope.money.mm = parseFloat(newValue);
			$scope.money.mm2 = parseFloat(newValue) * $scope.money.zhekou;
		});
		var model = 'oto';
		$scope.submit = function () {
			var para = {
				money: $scope.money.mm,
				spid: $stateParams.spid
			};
			if ($scope.showTypeTitle == "微信支付") {
				if (!window.Wechat) {
					alert("暂不支持微信支付！");
					return false;
				}
				Payment.wechatPay(model, para);
			}
			if ($scope.showTypeTitle == "支付宝支付") {
				alert("证书尚未配置，请用微信支付！");
				if (checkoutPara) {

				} else {

				}
			}
			if ($scope.showTypeTitle == "余额支付") {
				Payment.creditShopPay(function (response) {
					if (response.code == 0) {
						$ionicPopup.confirm({
							title: '余额支付',
							template: '可用余额：¥'+$scope.data.credit2,
							buttons: [
								{
									text: '取消', onTap: function () {
									return false;
								}
								},
								{
									text: '确定', type: 'button-assertive', onTap: function () {
									return true;
								}
								}
							]
						}).then(function(res) {
							if(res) {
								if($scope.money.mm <= $scope.data.credit2){
									Message.show('支付成功', 1500);
									$http.post(response.data);
									$timeout(function () {
										$state.go('tab.order');
									}, 1500)
								}else{
									Message.show('余额不足啦！');
									return false;
								}

							} else {

							}
						});
					} else {
						Message.show(response.msg, 1500);
					}
				}, function () {
					Message.show('通信错误,请检查网络!', 1500)
				}, para);
			}
		}
	})

	.controller('shopCenterCtrl', function ($scope, $stateParams, $state, Message) {

	})

	.controller('shopOrderListCtrl', function ($scope, $stateParams, $state, Message, Shop) {
		$scope.orderList = {};
		$scope.data = {
			time: '',
			num: ''
		};
		$scope.pas = '';
		$scope.bol = true;
		$scope.toggle = function () {
			$scope.bol = !$scope.bol;
		};

		// 分页
		$scope.pageInfo = {
			currentPage: 1
		};
		shopOrderData();
		function shopOrderData() {
			Shop.shopOrderList(function (response) {
				if(response.code == 0){
					$scope.orderList = response.data;
				}else if(response.code == 1){
					Message.show(response.msg);
				}
			}, function (error) {
				Message.show(error.message);
			}, $scope.pageInfo.currentPage, $scope.pas);
		}
		$scope.pageNext = function (currentPage) {
			if(currentPage){
				$scope.pageInfo.currentPage = currentPage;
			}else{
				$scope.pageInfo.currentPage ++;
			}
			if($scope.pageInfo.currentPage >= $scope.orderList.pageCountNum){
				$scope.pageInfo.currentPage = $scope.orderList.pageCountNum;
			}
			shopOrderData();
		}
		$scope.pagePre = function (currentPage) {
			if(currentPage){
				$scope.pageInfo.currentPage = 1
			}else{
				$scope.pageInfo.currentPage --;
			}
			if($scope.pageInfo.currentPage <= 0){
				$scope.pageInfo.currentPage = 1;
			}
			shopOrderData();
		}
		// 排序
		$scope.orderPrice = function (pas) {
			if(pas == 'price'){
				$scope.pas = pas;
				$scope.myprice = true;
				$scope.mytime = false;
			}else{
				$scope.pas = 'time';
				$scope.mytime = true;
				$scope.myprice = false;
			}
			shopOrderData();
		}
		// 搜索订单
		$scope.searchOrderList = function(){
			if($scope.data.num == ''){
				Message.show('请输入订单编号！');
				return false;
			};
			$scope.bol = true;
			Shop.searchOrderList(function (response) {
				$scope.orderList = response.data;
				if(response.code == 1){
					Message.show(response.msg);
					return false;
				}
			},function (error) {
				Message.show(error.message)
			}, $scope.data.num)
		}
		// 重置
		$scope.reset = function () {
			$scope.data = {
				time: '',
				num: ''
			};
		}
	})


	.controller('shopWithdrawListCtrl', function ($scope, $stateParams, $state, Message, Shop) {
		$scope.shopWithdraw = {};
		Shop.shopWithdrawList(function (response) {
			if(response.code == 0){
				$scope.shopWithdraw = response.data;
			}else if(response.code == 1){
				Message.show(response.msg);
			}
		}, function (error) {
			Message.show(error.message)
		})
	})

	.controller('shopWithdrawCtrl', function ($scope, $stateParams, $state, Message, Shop) {
		$scope.info = {
			cname: '',
			mobile: '',
			alipay: '',
			username: '',
			money: ''
		}
		$scope.widthdrawSuccess = function (pas) {
			var pas = {
				cname: $scope.info.cname,
				mobile: $scope.info.mobile,
				alipay: $scope.info.alipay,
				username: $scope.info.username,
				money: $scope.info.money
			}
			if ($scope.info.cname == '') {
				Message.show('请填写商家负责人！');
				return false;
			}
			if ($scope.info.mobile == '') {
				Message.show('请填写联系电话！');
				return false;
			}
			if ($scope.info.alipay == '') {
				Message.show('请填写支付宝账号！');
				return false;
			}
			if ($scope.info.username == '') {
				Message.show('请填写姓名！');
				return false;
			}
			if ($scope.info.money == '') {
				Message.show('请输入提现金额！');
				return false;
			}
			Shop.shopWithdraw(function (response) {
				Message.show(response.msg);
				$state.go('shop.withdrawList')
			}, function (error) {
				Message.show(error.message)
			}, pas)
		}

	})

	.controller('shopOrderInfoCtrl', function ($scope, $stateParams, $state, Message, Shop) {
		$scope.shopOrder = {};
		Shop.shopOrderInfo(function (response) {
			if(response.code == 0){
				$scope.shopOrder = response.data;
			}else if(response.code == 1){
				Message.show(response.msg);
			}

		}, function (error) {
			Message.show(error.message)
		})
	})

	.controller('shopOrderDetailCtrl', function ($scope, $stateParams, $state, Message, Shop) {
		$scope.data = {
			confiNum:''
		};
		$scope.orderDetail = {};
		$scope.id = $stateParams.id;
		$scope.spid = $stateParams.spid;
		shopOrderDetail();
		function shopOrderDetail() {
			Shop.shopOrderDetail(function (response) {
				$scope.orderDetail = response.data;
			}, function (error) {
				Message.show(error.message)
			},$scope.id, $scope.spid);
		}

		$scope.confirm = function () {
			if ($scope.data.confiNum == '') {
				Message.show('请输入核销码！');
				return false;
			}
			Shop.shopOrderConfirm(function (response) {
				if(response.code == 0){
					Message.show(response.msg);
					$state.go('shop.orderList');
				}else if(response.code == 1){
					Message.show(response.msg);
					return false;
				}
			}, function (error) {
				Message.show(error.message)
			},$scope.id, $scope.spid, $scope.data.confiNum);
		}

	})

	.controller('IndexCtrl', function ($scope, Oto, Home, Article, $state, $ionicSlideBoxDelegate, $cordovaBarcodeScanner, $ionicLoading, List, $sce, $timeout, $http, $cordovaInAppBrowser, Message, Lbs, $ionicModal, $anchorScroll, $location, $ionicScrollDelegate, $ionicPopup, Storage) {
		$scope.focuslListData = {};
		$scope.navList = {};
		$scope.custom = {};
		$scope.moreGoods = [];
		$scope.hotCity = [];
		$scope.isShowPic = true;
		Oto.fetch();
		Article.list().then(function (res) {
			if(res.code == 0){
				$scope.awardNotice = res.data
			}else if(res.code == 1){
				// Message.show(res.msg)
			}
		});
		var  autoScroll = function(ul_bz){
			$(ul_bz).animate({
				marginTop : "-40px"
			},500,function(){
				$(this).css({marginTop : "0px"}).find("li:first").appendTo(this);
			});
		};
		setInterval(function(){autoScroll(".oUl")},3000);
		$scope.$on('home.updated', function () {
			// 获取幻灯
			$scope.focuslListData = Oto.getFocusList();
			$ionicSlideBoxDelegate.$getByHandle("slideimgs").loop(true);
			$ionicSlideBoxDelegate.update();
			$scope.isShowPic = false;
			// 获取导航菜单
			$scope.navList = Oto.getNavList();
			if($scope.navList.length > 1){
				$scope.isShowPage = true;
			}else{
				$scope.isShowPage = false;
			}
			$scope.noticeInfo = Oto.noticeInfo();
		});
// 扫码处理
		$scope.scan = function () {
			document.addEventListener("deviceready", function () {
				$cordovaBarcodeScanner.scan({
					resultDisplayDuration:0,
					prompt: "请保持手机或二维码稳定"
				}).then(function (barcodeData) {
					if (barcodeData.cancelled) {
						return false;
					}
					$scope.qr = barcodeData;
					var preg = /^http:\/\/.*\/dapp\/\d+\/(\d+)\/$/;
					if (preg.test($scope.qr.text)) {
						var spid = $scope.qr.text.match(preg)[1];
						$state.go('user.offlinePay', {'spid': spid});
					} else {
						Message.show('二维码不是平台专用，请核对后再扫！', 2000);
					}
				}, function (error) {
					console.log(error);
					Message.show('扫码失败，请尝试重新扫码！', 2000);
				});
			});
		};
		// 导航跳转
		$scope.toUrl = function (id, type) {
			Oto.getNav(id, type).then(function (data) {
				if(data.link.url == 'shops.shopsInfo'){
					$state.go('offline.shopInfo',{spid:data.link.param.id});
				}else if(data.link.url == 'shops.shopsList'){
					$state.go('offline.shopList',{cid:data.link.param.id, title: data.title});
				}else if(data.link.http == 1){
					document.addEventListener("deviceready", function () {
						var options = {
							location: 'yes',
							clearcache: 'yes',
							toolbar: 'yes',
							toolbarposition: 'top'

						};
						$cordovaInAppBrowser.open(data.link.url, '_self', options)
							.then(function(event) {
								console.log(event)
							})
							.catch(function(event) {
								// error
								console.log(event)
							});
					}, false);
				}else{
					$state.go(data.link.url);
				}
			});
		};

//		搜店铺或商品
		$scope.showDrop = false;
		$scope.searchType = 'goods';
		$scope.getShop = function (selectType, name) {
			document.getElementById("getSelect").innerHTML=name;
			$scope.searchType = selectType;
			$scope.showDrop = false;
		};

		$scope.search = function (keywords) {
			if(!keywords || keywords.length < 1){
				Message.show("请输入一个以上关键字！");
				return false;
			}
			$state.go('offline.shopList', {keywords:keywords})
		};

		// 选择城市modal
		$ionicModal.fromTemplateUrl('templates/modal/location.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.location = modal;
		});
		$scope.openModal = function() {
			$http.get('data/city.json').success(function (data) {
				$scope.cityList = data;
				$scope.location.show();
			});
		};
		// 锚点跳转
		$scope.quickSelect = function (x) {
			$location.hash(x);
			$anchorScroll();
			$ionicScrollDelegate.$getByHandle('citySelectScroll').resize();
		};
		$scope.curPosition = {"status": 1};//1：定位失败，2：定位中，3：定位成功, 4：并获取到更新
		$scope.orderEmpty = false;
		$scope.$on('shops.list.update', function(event,data) {
			Oto.getSearchCity(function (response) {
				$scope.curPosition.status = 4;
				Message.hidden();
				if (response.code == 1) {
					$scope.orderEmpty = true;
					return;
				}
				$scope.orderEmpty = false;
				$scope.shopList = response.data;
			}, function (err) {
				Message.show(err.message);
			}, data.lat, data.lng, '', data.page);
		});
		$scope.isShowBtm = false;
		// 下拉刷新
		$scope.doRefresh = function () {
			Oto.fetch();
			Article.list().then(function (res) {
				if(res.code == 0){
					$scope.awardNotice = res.data
				}else if(res.code == 1){
					// Message.show(res.msg)
				}
			});
			$scope.page = 2;//重新加载更多商品
			$scope.$broadcast('scroll.refreshComplete');
			$scope.$broadcast('shops.list.update', $scope.curPosition, '', 1);
			$scope.isShowBtm = false;
			$scope.noMore = false;
			$timeout(function () {
				$scope.noMore = true;
			}, 1500);
		};

		// 获取商品推荐
		// Home.fetchMoreGoods();
		$scope.$on('moreGoods.updated', function () {
			$scope.moreGoods = Oto.getMoreGoods();
		});
		// 下拉加载更多商品
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMoreGoods = function () {
			Oto.getSearchCity(function (response) {
				$scope.page++;
				// Message.hidden();
				if(response.code == 0){
					$scope.shopList = $scope.shopList.concat(response.data);
					$scope.$broadcast('scroll.refreshComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					}, 1500);
				}else if(response.code != 0){
					$scope.isShowBtm = true;
					$scope.noMore = false;
				}
			}, function (err) {
				Message.show(err.message);
			}, $scope.curPosition.lat, $scope.curPosition.lng, '', $scope.page);
		};
// 选择市
		$scope.orderEmpty = false;
		$scope.selectCity = function (city) {
			Oto.getSelectCity(city).then(function (response) {
				Message.hidden();
				if(response.code == 1){
					$scope.orderEmpty = true;
					Message.show(response.msg);
					return;
				}
				$scope.shopList = response.data;

				$scope.curPosition.status = 3;
				$scope.curPosition.city = city;
				//noinspection JSUnresolvedVariable
				$scope.curPosition.lat = response.data.latlng.lat;
				//noinspection JSUnresolvedVariable
				$scope.curPosition.lng = response.data.latlng.lng;
				Storage.set("curPosition", $scope.curPosition);
				$scope.$broadcast('shops.list.update', $scope.curPosition);
				$ionicSlideBoxDelegate.$getByHandle("slideimgs").loop(true);
				$ionicSlideBoxDelegate.update();
			});
			$scope.location.hide();
		};
		$scope.pageInfo = {};
		$scope.pageInfo.getSerachList = function () {
			if (!$scope.pageInfo.keyWord) {
				$scope.pageInfo.searchBol = false;
				return false;
			} else {
				$scope.pageInfo.searchBol = true;
			}
			Oto.getAddressList(function (response) {
				Message.hidden();
				if (response.code == 0) {
					$scope.pageInfo.searchList = response.data;
				} else {
					Message.show(response.msg);
				}
			}, function (error) {
				Message.show(error.message);
			}, $scope.pageInfo.keyWord);

		};

		$scope.pageInfo.setAddress = function (lat, lng, _str){
			Oto.getSearchCity(function (response) {
				Message.hidden();
				if(response.code == 1){
					Message.show(response.msg);
					return;
				}
				$scope.shopList = response.data;

				$scope.curPosition.status = 3;
				$scope.curPosition.city = _str;
				$scope.curPosition.lat = response.data.latlng.lat;
				$scope.curPosition.lng = response.data.latlng.lng;

				Storage.set("curPosition", $scope.curPosition);

				$ionicSlideBoxDelegate.$getByHandle("slideimgs").loop(true);
				$ionicSlideBoxDelegate.update();
			}, function (error) {
				Message.show(error.message)
			},lat, lng, _str)
		};

		// 定位
		document.addEventListener("deviceready", function () {
			if (Storage.get("curPosition") === null) {
				$scope.curPosition.status = 2;
				Message.loading("定位中……");
				baidu_location.getCurrentPosition(function (position) {
					$scope.curPosition.lat = position.latitude;
					$scope.curPosition.lng = position.lontitude;
					Lbs.getCity(function (respond) {
						if (respond.code == 0) {
							$scope.curPosition.city = respond.data.city;
							$scope.curPosition.status = 3;
							Storage.set("curPosition", $scope.curPosition);
							$scope.$broadcast('shops.list.update', $scope.curPosition);
							$scope.noMoreGoods=false;
						} else {
							$scope.noMoreGoods=false;
							$scope.curPosition.status = 1;
							Message.show(respond.msg);
						}
					}, function () {
						$scope.curPosition.status = 1;
						$scope.noMoreGoods=false;
						Message.show("定位失败，请手动选择当前城市");
					}, $scope.curPosition);
				}, function (err) {
					$scope.noMoreGoods=false;
					$scope.curPosition.status = 1;
					Message.show('定位失败，请在左上角手动选择当前城市！', 3000);
					console.info(err);
					return false;
				})
			} else {
				$scope.curPosition.status = 3;
				$scope.curPosition.city = Storage.get("curPosition").city;
				$scope.curPosition.lat = Storage.get("curPosition").lat;
				$scope.curPosition.lng = Storage.get("curPosition").lng;
				$scope.$broadcast('shops.list.update', $scope.curPosition);
				//校正历史定位
				baidu_location.getCurrentPosition(function (position) {
					var newPosition = {};
					newPosition.lat = position.latitude;
					newPosition.lng = position.lontitude;
					Lbs.getCity(function (response) {
						if (response.code == 0) {
							newPosition.city = response.data.city;
							if (newPosition.city !== "" && newPosition.city != $scope.curPosition.city) {
								//提示切换位置  弹窗
								$ionicPopup.confirm({
									template: '当前城市为：' + newPosition.city + '是否切换？',
									buttons: [
										{
											text: '取消', onTap: function () {
											return false;
										}
										},
										{
											text: '确定', type: 'button-assertive', onTap: function () {
											$scope.curPosition.status = 3;
											$scope.curPosition.city = newPosition.city;
											$scope.curPosition.lat = response.data.lat;
											$scope.curPosition.lng = response.data.lng;
											Storage.set("curPosition", $scope.curPosition);
											$scope.$broadcast('shops.list.update', $scope.curPosition);
											// return true;
										}
										}
									]
								});
							}else if (Lbs.calcDistance($scope.curPosition, response.data) > 0.4) {
								$scope.curPosition.status = 3;
								$scope.curPosition.city = newPosition.city;
								$scope.curPosition.lat = newPosition.lat;
								$scope.curPosition.lng = newPosition.lng;
								Storage.set("curPosition", $scope.curPosition);
								$scope.$broadcast('shops.list.update', $scope.curPosition);
							}
						}
					}, function () {
						console.info(err);
					}, newPosition);
				}, function (err) {
					//Do Nothing
					console.info(err);
					return false;
				});
			}
		}, false);
	})

	.controller('ArticleCtrl', function ($scope, $stateParams) {
		console.log("22335");
	})

	.controller('ShopCtrl', function ($scope, $stateParams, Message, Shop, Goods, $state, $ionicPopover) {
		$scope.shop = {};
		$scope.spid = $stateParams.spid;
		$scope.title = $stateParams.title;
		$scope.speType = $stateParams.speType;
		$scope.isCare = 0;
		Shop.getShop(function (response) {
			Message.hidden();
			$scope.shop = response.data;
			$scope.isCare = $scope.shop.isCare;
			if (response.code != 0) {
				$state.go('tab.home');
				Message.show(response.msg);
				return false;
			}
		}, function (error) {
			Message.show(error.message)
		}, $scope.spid, $scope.isCare);
		$scope.careShop = function () {
			Goods.shoucangShop(function (response) {
				if (response.code == 0) {
					if ($scope.isCare == 0) {
						$scope.isCare = 1;
					} else if ($scope.isCare != 0) {
						$scope.isCare = 0;
					}
				} else {
					Message.show(response.msg);
				}
			}, function (error) {
				Message.show(error.message)
			}, $scope.spid, 'spid');
		};
		$scope.shoucangGoods = function (isLike, id) {
			if (isLike == 0) {
				isLike = 1;
			} else if (isLike != 0) {
				isLike = 0;
			}
			Goods.shoucangShop(function () {
			}, function () {
			}, id, 'id')
		}
	})

	.controller('NewsListCtrl', function ($scope, $stateParams, Article, $ionicLoading, $timeout) {
		$scope.orderEmpty = false;
		Article.list().then(function (res) {
			if(res.code == 0){
				$scope.orderEmpty = false;
				$scope.list =res.data
			}else if(res.code == 1){
				$scope.orderEmpty = true;
			}
		});
		// 下拉刷新
		$scope.doRefresh = function () {
			Article.list().then(function (response){
				$scope.list = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				},1200);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1500'
				});
				$scope.page = 2;
			});
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Article.list($scope.page).then(function (response) {
				$scope.page++;
				if(response.code == 0){
					$scope.list = $scope.list.concat(response.data);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1200)
				}else if (response.code != 0) {
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
					$scope.noMore = false;
				}
			});
		};
	})

	.controller('NewsInfoCtrl', function ($scope, $stateParams, Article) {
		$scope.id = $stateParams.id;
		Article.detail($scope.id).then(function(res){
			if(res.code == 0){
				$scope.orderEmpty = false;
				$scope.info = res.data;
			}else{
				$scope.orderEmpty = true;
			}
		});
	})

	.controller('ShopInfoCtrl', function ($scope, $stateParams, Shop, Goods, User,$ionicSlideBoxDelegate, Message, $cordovaInAppBrowser, $ionicLoading) {
		$scope.shopsdetail = {slideInfo: '', locationUrl: '', isCare: '',careNum: '',shopInfo: ''};
		Shop.getShopsDetail($stateParams.spid).then(function (res) {
			Message.hidden();
			if(res.code == 0){
				$scope.shopsdetail = res.data;
				$scope.shopsdetail.slide = res.data.slideInfo;
				$ionicSlideBoxDelegate.$getByHandle("slideimgs").update();
			}else if(res.code == 1){
				Message.show(res.msg)
			}
		});
		// Shop.nearbyShop(function (res) {
		// 	Message.hidden();
		// 	if(res.code == 0){
		// 		$scope.shopList = res.data
		// 	}
		// },function () {
        //
		// },$stateParams.spid);
		$scope.praise = function () {
			if($scope.shopsdetail.isFollow == '0'){
				User.praise($scope.shopsdetail.id).then(function (response) {
					if(response.code == 0){
						$scope.shopsdetail.isFollow = 1;
						$scope.shopsdetail.followNum++;
						Message.show(response.msg);
					}else{
						Message.show('您已经赞过');
					}
				});
			}else{
				Message.show('您已经赞过');
			}
		};
		$scope.showAddress = function (url) {
			document.addEventListener("deviceready", function () {
				var options = {
					location: 'yes',
					clearcache: 'yes',
					toolbar: 'yes',
					toolbarposition: 'top'

				};
				$cordovaInAppBrowser.open(url, '_system', options)
					.then(function(event) {
						console.log(event)
					})
					.catch(function(event) {
						// error
						console.log(event)
					});
			}, false);
		};

		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Shop.nearbyShop(function (res) {
				Message.hidden();
				if(res.code == 0){
					$scope.page++;
					$scope.shopList = $scope.shopList.concat(response.data);
					$scope.$broadcast('scroll.refreshComplete');

				}else if(res.code != 0){
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多数据了！',
						duration: '1000'
					});
					$scope.noMore = false;
				}
			},function () {

			},$stateParams.spid, $scope.page);
		};
	})

	.controller('ShopListCtrl', function ($scope, $stateParams, $ionicPopover, Oto, Storage, $ionicLoading, $timeout, Message) {
		$scope.cid = $stateParams.cid;
		$scope.info = {keywords: ''};
		$scope.keywords = $stateParams.keywords || $scope.info.keywords;
		$scope.title = $stateParams.title;
		$scope.shopList = {};
		$scope.curPosition = Storage.get("curPosition", $scope.curPosition);
		$scope.orderEmpty = false;
		Oto.offlineShopsList($scope.cid, $scope.keywords).then(function (response) {
			if(response.code == 0){
				$scope.orderEmpty = false;
				$scope.shopList = response.data;
			}else if(response.code == 1){
				$scope.orderEmpty = true;
			}
		});
		$scope.search = function (searchType, keywords) {
			if (!keywords || keywords.length < 1) {
				Message.show("请输入一个以上关键词！");
				return false;
			}
			Oto.offlineShopsList( $scope.cid, keywords).then(function (response) {
				if(response.code == 0){
					$scope.orderEmpty = false;
					$scope.shopList = response.data;
				}else if(response.code == 1){
					$scope.orderEmpty = true;
				}
			});
		};
		$scope.isShowBtm = false;
		// 列表下拉刷新
		$scope.doRefresh = function () {
			Oto.offlineShopsList($scope.cid, $scope.keywords).then(function (response) {
				if(response.code == 0){
					$scope.orderEmpty = false;
					$scope.noMore = false; //下拉加载时避免上拉触发
					$scope.isShowBtm = false;
					$scope.shopList = response.data;
					$timeout(function () {
						$scope.noMore = true;
					}, 1500);
					$scope.$broadcast('scroll.refreshComplete');
					$ionicLoading.show({
						noBackdrop: true,
						template: '刷新成功！',
						duration: '1200'
					});
				}else if(response.code == 1){
					$scope.orderEmpty = true;
				}
			});
		};
		// 下拉加载更多商家
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMoreGoods = function () {
			Oto.offlineShopsList($scope.cid, $scope.keywords, $scope.page).then(function (response) {
				$scope.page++;
				$scope.isShowBtm = false;
				$scope.shopList = $scope.shopList.concat(response.data);
				$scope.$broadcast('scroll.refreshComplete');
				if(response.code != 0){
					$scope.isShowBtm = true;
					$scope.noMore = false;
				}
			});
		};
		// 筛选遮罩层
		$ionicPopover.fromTemplateUrl('templates/offline/shopList-popover.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});

		// 筛选
		$scope.areaShow = function () {
			$scope.popover.show();
		};

		// 筛选遮罩层
		$ionicPopover.fromTemplateUrl('templates/offline/shopList-popover1.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover1 = popover;
		});

		// 筛选
		$scope.classifyShow = function () {
			$scope.popover1.show();
		};
	})

	.controller('ReturnCtrl', function ($scope, $stateParams, $ionicPopover,Order,Message,$filter,User,$ionicActionSheet,$cordovaCamera) {
		$scope.returnInfo = {allPrice: 0, goodsInfo: '', selecedId: '',images:[]};
		$scope.returnList = '';
		$scope.orderSn = $stateParams.orderSn;
		$scope.types = false;//未选
		$scope.retof = {reason:['拍错/多拍/不想要','协商一致道歉','缺货','其他'],type:['未收货','已收货','只退钱']};
		$scope.poptitle = {reason:'退货原因',type:'退货状态'};
		$scope.popnum = {reason:0,type:0};

		//获取数据
		Order.returnGoodsInfo(function (response) {
			Message.hidden();
			if(response.code == 0) {
				$scope.returnList = response.data;
				$scope.goodsList = $scope.returnList.orderInfo.goodsInfo;
				$scope.returnList.allPrice = '0.00';
				angular.forEach($scope.returnList.orderInfo.goodsInfo,function (v,key) {
					v.types = false;
					v.number=v.goodsNum;//设置动态数量进行判断大小
				});
			}
		},function (error) {

		}, $scope.orderSn);

		//单个选中与否  val（key） num(判断增加还是减少)
		$scope.isCheck=function(k){
			$scope.goodsList[k].types=!$scope.goodsList[k].types;
			$scope.totalNumFun();
			angular.forEach($scope.returnList.orderInfo.goodsInfo,function (v,k){//循环判断是否添加全选
				if(!$scope.goodsList[k].types){//未选中
					$scope.types=false;	//全选
				}else{//选中
					$scope.types=true;//选中
				}
			})
		};

		//计算价格
		$scope.totalNumFun=function(){
			$scope.returnList.allPrice=0;
			angular.forEach($scope.returnList.orderInfo.goodsInfo,function (v,k) {//循环判断是否添加全选
				if($scope.goodsList[k].types){//选中
					$scope.returnList.allPrice += ($scope.goodsList[k].goodsPrice*1)*($scope.goodsList[k].goodsNum*1);
				}
			});
			$scope.returnList.allPrice = $filter('number')($scope.returnList.allPrice, 2)
			console.log($scope.returnList.allPrice)
		};

		// 筛选遮罩层
		$ionicPopover.fromTemplateUrl('templates/user/return-popover.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});

		// 筛选
		$scope.reasonShow = function (type) {
			$scope.poptype = type;
			$scope.popover.show();
		};
		//
		$scope.selectpoptype = function(type,i){
			console.log($scope.returnList.selecedId);
			console.log($scope.popnum.type);
			$scope.popnum[type] = i;
			$scope.popover.hide()
		};

		// 图片选择 显示操作表
		var selectImages = function (from) {
			// TODO APP端打开
			var options = {
				quality: 85,
				destinationType: Camera.DestinationType.DATA_URL,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				allowEdit: false,
				encodingType: Camera.EncodingType.JPEG,
				targetWidth: 200,
				targetHeight: 200,
				correctOrientation: true,
				cameraDirection: 0
			};
			if (from === 'camera') {
				options.sourceType = Camera.PictureSourceType.CAMERA;
			}
			document.addEventListener("deviceready", function () {
				$cordovaCamera.getPicture(options).then(function (imageData) {
					$scope.returnInfo['images'].push("data:image/jpeg;base64," + imageData);
				}, function (error) {
					console.log(error);
				});
			}, false);
		};
		$scope.uploadImg = function() {
			var buttons = [];
			if (ionic.Platform.isAndroid()) {
				buttons = [
					{text: "<i class='ion-android-camera t_shopsDetails_tableIcon'></i>拍一张照片"},
					{text: "<i class='ion-android-image t_shopsDetails_tableIcon'></i>从相册选一张"}
				]
			} else {
				buttons = [
					{text: "拍一张照片"},
					{text: "从相册选一张"}
				]
			}
			$ionicActionSheet.show({
				buttons: buttons,
				titleText: '请选择',
				cancelText: '取消',
				buttonClicked: function (index) {
					if (index === 0) {
						selectImages( "camera");
					} else if (index === 1) {
						selectImages();
					}
					return true;
				}
			})
		};


		// 退货申请
		$scope.applyReturnGoods = function (info) {
			console.log($scope.popnum.type);
			if($scope.returnList.allPrice == '0.00'){
				Message.show('请选中退货商品');
				return;
			}
			var goodsList = [];
			angular.forEach($scope.goodsList,function (v,k) {//循环判断是否添加全选
				if($scope.goodsList[k].types){
					var temp = {'goodsId': $scope.goodsList[k].goodsId, 'goodsNum':$scope.goodsList[k].goodsNum};
					goodsList.push(temp);
				}
			});
			User.returnsub(function (res) {

			},function () {

			},$scope.orderSn, info + $scope.returnInfo.goodsInfo, $scope.returnList.allPrice, goodsList,$scope.returnInfo.images,$scope.popnum.type);
		}
	})

	.controller('returnInfoCtrl', function ($scope, $stateParams, $ionicPopover, User) {
		$scope.orderSn = $stateParams.orderSn;
		$scope.apply = {express: '', expressNo: ''};
		$scope.sureApply = function () {
			if(!$scope.apply.express){
				Message.show('请输入物流渠道！');
				return
			}
			if(!$scope.apply.expressNo){
				Message.show('请输入物单号！');
				return
			}
			User.returnGoods(function (response) {
			}, function () {
			},$scope.orderSn, $scope.apply.express, $scope.apply.expressNo)
		}
	})
	.controller('PaymentCreditCtrl', function ($scope, $stateParams, $ionicPopover) {
		$scope.popover = true;
		$scope.popoverShow = function () {

		}
	})

	.controller('userQrcodeCtrl', function ($scope, User, Message) {
		$scope.QRcode = {};
		User.getQRcode(function (response) {
			Message.hidden();
			if(response.code == 0){
				$scope.QRcode = response.data;
			}else if(response.code == 1){
				Message.show(response.msg)
			}
		}, function (error) {
			Message.show(error.message)
		})
	})

	.controller('MyCtrl', function ($scope, ENV, $state, Storage, Message, $ionicLoading, $timeout, $ionicActionSheet, $ionicHistory, User, Mc, $rootScope, Shop) {
		$scope.$on('$ionicView.enter', function () {
			$rootScope.href = window.location.href;
			Storage.set("href", $rootScope.href);
			if (!User.checkAuth()) {
				$scope.checkAuth = false;
			}else{
				$scope.checkAuth = true;
			}
			if (Storage.get('user') && Storage.get('user').uid != '') {
				$scope.userInfo = Storage.get('user');
			} else {
				$scope.userInfo = "";
			}
		});

		$scope.develop =function () {
			Message.show('正在开发中')
		};
		//获取数据
		Mc.getUserInfo(function (response) {
			Message.hidden();
			if(response.code == 0){
				$scope.pageInfo = response.data;
				// $rootScope.globalInfo.data.isDappShop = response.data.isShop;
			}else{
				Message.show(response.msg)
			}
		}, function (error) {
			Message.show(error.message);
		});
		$scope.toApplyShop = function () {
			Shop.applyfor(function(res){
				Message.hidden();
				if(res.code == 0){
					$state.go('user.applyfor')
				}else {
					Message.show(res.msg)
				}
			},function(){});
		};
		$scope.doRefresh = function () {
			Mc.getUserInfo(function (response) {
				$scope.pageInfo = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1500'
				});
			}, function (error) {
				Message.show(error.message);
			});
		};
		// 是否是城市服务商
		$scope.isCityAgent = function () {
			$state.go('user.applyAgent')
		};
		// // 是否是分销商
		// $scope.isAgent = function () {
		// 	Mc.isApplyfor(function (response) {
		// 		Message.hidden();
		// 		if (response.code == 0) {
		// 			$state.go('user.applyAgent')
		// 		} else if (response.code == 301) {
		// 			Message.show(response.msg);
		// 		}
		// 	}, function (error) {
		// 		Message.show(error.message)
		// 	},'get')
		// }
	})

	.controller('cityInfoCtrl', function ($scope, $stateParams, Message, Credit, $ionicPopover, $timeout, $ionicLoading) {
		$scope.list = {};
		$scope.orderEmpty = false;
		Credit.cityRebate().then(function (res) {
			if(res.code == 0){
				$scope.list = res.data;
				$scope.orderEmpty = false
			}else{
				$scope.orderEmpty = true
			}
		});
		$scope.search = function (uid) {
			if(!uid){
				Message.show('请输入ID');
				return
			}
			Credit.cityRebate('1','search',uid).then(function (res) {
				$scope.list = res.data;
				if(!res.data.info){
					Message.show(res.msg)
				}
			});
		};
		// 下拉刷新
		$scope.doRefresh = function () {
			Credit.cityRebate().then(function (response){
				$scope.list = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				},1200);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1500'
				});
				$scope.page = 2;
			});
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Credit.cityRebate($scope.page).then(function (response) {
				if (response.data.info == '') {
					$scope.noMore = false;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}else{
					$scope.page++;
					$scope.list.info = $scope.list.info.concat(response.data.info);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1200)
				}
			});
		};
	})


	.controller('partnerInfoCtrl', function ($scope, $stateParams, Message, Credit, $ionicPopover, $timeout, $ionicLoading) {
		$scope.info = {};
		$scope.orderEmpty = false;
		Credit.cityPartner().then(function (res) {
			if(res.code == 0){
				$scope.info = res.data;
				$scope.orderEmpty = false
			}else{
				$scope.orderEmpty = true
			}
		});
		// 下拉刷新
		$scope.doRefresh = function () {
			Credit.cityPartner().then(function (response){
				$scope.info = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				},1200);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1500'
				});
				$scope.page = 2;
			});
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Credit.cityPartner($scope.page).then(function (response) {
				if(response.code == 0){
					$scope.page++;
					$scope.info = $scope.info.concat(response.data);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1200)
				}else if (response.code != 0) {
					$scope.noMore = false;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}
			});
		};
	})

	.controller('listCtrl', function ($scope, $stateParams, Message, List, $ionicPopover, $timeout, $ionicLoading) {
		$scope.lists = {};
		// $scope.condition.keywords = $stateParams.k;
		$scope.keywords = $stateParams.k;
		$scope.searchType = $stateParams.type;
		$scope.spid = $stateParams.spid;
		$scope.cid = $stateParams.cid;
		$scope.marking = $stateParams.marking || '综合';
		List.getList(function (response) {
			if(response.code == 0){
				$scope.orderEmpty = false;
				$scope.lists = response.data;
			}else if(response.code == 1){
				$scope.orderEmpty = true;
			}
		}, function (error) {
			Message.show(error.msg);
		}, $scope.searchType, $scope.keywords, $scope.spid, $scope.cid, $scope.marking);

		$scope.search = function () {
			List.search($scope.searchType, $scope.keywords);
		};


		// 综合遮罩层
		$ionicPopover.fromTemplateUrl('templates/user/list-popover.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});

		// 综合
		$scope.listcompreShow = function (type) {
			$scope.marking = type;
			$scope.page = 2;
			if(type == '价格'  && $scope.marking_price != 1){
				$scope.marking_price = 1;
			}else if(type == '价格' && $scope.marking_price == 1){
				$scope.marking_price = 2;
			}
			List.getSearchType(function (response) {
				$scope.lists = response.data;
			}, function (error) {
				Message.show(error.message);
			}, $scope.marking, $scope.keywords, $scope.searchType, $scope.spid, $scope.cid, $scope.marking_price)
		};

		$scope.doRefresh = function () {
			List.getSearchType(function (response){
				$scope.lists = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				},1500);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
				$scope.page = 2;
			},function (error) {
				Message.show(error.message);
			},$scope.marking, $scope.keywords, $scope.searchType, $scope.spid, $scope.cid, $scope.marking_price);
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			List.getSearchType(function (response) {
				if (response.code == 1) {
					$scope.noMore = false;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多商品了！',
						duration: '1200'
					});
				}else if(response.code == 0){
					$scope.page++;
					$scope.lists = $scope.lists.concat(response.data);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1500);
				}
			},function (error) {
				Message.show(error.message);
			},$scope.marking, $scope.keywords, $scope.searchType, $scope.spid, $scope.cid, $scope.marking_price, $scope.page);
		};
	})

	.controller('reviseInfoCtrl', function ($scope, User) {
		$scope.gogo = function () {
			User.logout();
		}
	})

	.controller('userCenterCtrl', function ($scope, User, $state, System, Message) {
		$scope.logout = function () {
			User.logout();
			$state.go('auth.login');
		};
		$scope.checkUpdate = function () {
			System.checkUpdate().then(function () {
				Message.show("已经是最新版本！", 1200);
			});
		}
	})

	.controller('userInfoCtrl', function ($scope, Storage, ENV, $cordovaCamera, $cordovaCapture, Message, Area, $timeout, $state, $rootScope, User, $ionicActionSheet, $ionicModal, $ionicScrollDelegate) {
		/*个人资料（头像跟昵称）*/
		$scope.up = {
			userInfo: User.getCurrentUser()
		};
		$scope.default_avatar = ENV.default_avatar;

		var _img = '';

		// 头像选择 显示操作表
		var selectImages = function (from) {
			var options = {
				quality: 85,
				destinationType: Camera.DestinationType.DATA_URL,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				allowEdit: false,
				encodingType: Camera.EncodingType.JPEG,
				targetWidth: 200,
				targetHeight: 200,
				correctOrientation: true,
				cameraDirection: 0
			};
			if (from == 'camera') {
				options.sourceType = Camera.PictureSourceType.CAMERA;
			}
			document.addEventListener("deviceready", function () {
				$cordovaCamera.getPicture(options).then(function (imageURI) {
					_img = imageURI;
					$scope.imgUrl = "data:image/jpeg;base64," + imageURI;
					var image = document.getElementById('myImage');
					image.src = $scope.imgUrl;
					// User.getImgUrl(imageURI);
				}, function (error) {
					console.log(error);
				});
			}, false);
		};
		// 弹出选择图片
		$scope.uploadAvatar = function () {
			var buttons = [];
			if (ionic.Platform.isAndroid()) {
				buttons = [
					{text: "<i class='ion-android-camera t_shopsDetails_tableIcon'></i>拍一张照片"},
					{text: "<i class='ion-android-image t_shopsDetails_tableIcon'></i>从相册选一张"}
				]
			} else {
				buttons = [
					{text: "拍一张照片"},
					{text: "从相册选一张"}
				]
			}
			$ionicActionSheet.show({
				buttons: buttons,
				titleText: '请选择',
				cancelText: '取消',
				buttonClicked: function (index) {
					if (index == 0) {
						selectImages("camera");
					} else if (index == 1) {
						selectImages();
					}
					return true;
				}
			})

		};

		// 保存图片
		$scope.saveAvatar = function () {
			var image = document.getElementById('myImage');
			console.log();
			if (!_img && $scope.up.userInfo.nickname == Storage.get('user').nickname && $scope.up.userInfo.area == Storage.get('user').area) {
				Message.show('没有修改任何信息！');
				return;
			}

			if (!$scope.up.userInfo.nickname) {
				Message.show('昵称不能为空！');
				return;
			}
			if (!$scope.up.userInfo.area) {
				Message.show('请选择地区！');
				return;
			}

			User.saveAvatar(function (response) {
				if (response.code !== 0) {
					Message.show(response.msg);
					return;
				}
				$scope.up.userInfo.avatar = image.src;
				Storage.set('user', $scope.up.userInfo);
				$rootScope.globalInfo.pageMsg = $scope.up.userInfo;
				$rootScope.$broadcast('userInfo.update');
				Message.show(response.msg, 2000);
				$state.go('user.center');
			}, function (error) {
			}, _img, $scope.up.userInfo.nickname, $scope.up.userInfo.area);
		};

		//修改昵称侧滑
		$scope.bolNone = false;
		$timeout(function () {
			$scope.bolNone = true;
		}, 1);
		$scope.bol = $scope.bolNone;
		$scope.changeBol = function () {
			$scope.bol = !$scope.bol;
		};

		// 我的地址
		$scope.areaList = {};
		$ionicModal.fromTemplateUrl('templates/user/area.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.area = modal;
		});
		$scope.openModal = function () {
			Area.getList(function (data) {
				$scope.areaList = $scope.areaData = data;
			});
			$scope.area.show();
		};
		$scope.selectArea = function (id) {
			$ionicScrollDelegate.scrollTop();
			var pid = id.substr(0, 2) + "0000";
			var cid = id.substr(0, 4) + "00";
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00" && id.substr(4, 2) != "00") {
				$scope.up.userInfo.area = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + $scope.areaData[pid]['cities'][cid]['districts'][id];
				$scope.area.hide();
				return true;
			}
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'][id]['districts'];
				if ($scope.areaList.length <= 0) {
					$scope.up.userInfo.area = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + "其他（县/区）";
					$scope.area.hide();
				}
				return true;
			}
			if (id.substr(0, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'];
				return true;
			}
		};
	})

	/*我的账户（名字银行支付宝）*/
	.controller('myAccountCtrl', function ($scope, NameBankAlipy, Storage, $rootScope) {
		/*if (Storage.get('NBA')) {
		 } else {
		 NameBankAlipy.fetchNBA();
		 }
		 $scope.$on('namebankalipy.updata', function () {
		 Storage.set('NBA', NameBankAlipy.getNBA());
		 });*/
	})

	.controller('myNameCtrl', function ($scope, NameBankAlipy, Message, ENV, $state, $ionicActionSheet, $cordovaCamera, $rootScope, Storage) {
		$scope.pageInfo = {
			data: {}, //请求数据
			method: {}//方法对象
		};
		var _str = '';

		$scope.bol = false;

		NameBankAlipy.getNBA(function (response) {
			$scope.pageInfo.realname = response.data.realname;
			$scope.pageInfo.idCard = response.data.idcard;
			$scope.pageInfo.idcardA = response.data.idcardImg.idcardA;
			$scope.pageInfo.idcardB = response.data.idcardImg.idcardB;
			if (response.data.realname && response.data.idcard && response.data.idcardImg.idcardA && response.data.idcardImg.idcardB) {
				$scope.bol = true;
			} else {
				//证明没有验证过
				$scope.bol = false;
			}
			_str = response.data.realname;
		}, function () {
			Message.show('通信错误,请检查网络!', 1000);
		});

		$scope.pageInfo.method.upInfo = function () {
			/*if ($scope.pageInfo.realname == _str) {
			 Message.show('信息未做改变');
			 return;
			 }*/

			if (!$scope.pageInfo.realname || $scope.pageInfo.realname.length < 2) {
				Message.show('请输入正确的姓名');
				return;
			}

			if (!$scope.pageInfo.idCard || !ENV.REGULAR_IDCARD.test($scope.pageInfo.idCard)) {
				Message.show('请输入正确的身份证号码');
				return;
			}

			if (!$scope.pageInfo.img1) {
				Message.show('请上传身份证正面图片');
				return;
			}

			if (!$scope.pageInfo.img2) {
				Message.show('请上传身份反面图片');
				return;
			}

			NameBankAlipy.updataAccount(function (response) {
				Message.show(response.msg);
				if (response.code == 0) {
					/*$rootScope.globalInfo.pageMsg.realname = $scope.pageInfo.realname;
					 var _str = Storage.get('user');
					 _str.realname = $scope.pageInfo.realname;
					 Storage.set('user', _str);*/
					$scope.bol = true;
					/*$state.go('my-account');*/
				}
			}, function (error) {
				Message.show(error.message);
			}, {
				name: $scope.pageInfo.realname,
				idcard: $scope.pageInfo.idCard,
				idcardA: $scope.pageInfo.img1,
				idcardB: $scope.pageInfo.img2
			}, 1);
		};

		$scope.uploadAvatar = function (type) {
			var buttons = [];
			if (ionic.Platform.isAndroid()) {
				buttons = [
					{text: "<i class='ion-android-camera t_shopsDetails_tableIcon'></i>拍一张照片"},
					{text: "<i class='ion-android-image t_shopsDetails_tableIcon'></i>从相册选一张"}
				]
			} else {
				buttons = [
					{text: "拍一张照片"},
					{text: "从相册选一张"}
				]
			}
			$ionicActionSheet.show({
				buttons: buttons,
				titleText: '请选择',
				cancelText: '取消',
				buttonClicked: function (index) {
					if (index == 0) {
						selectImages("camera", type);
					} else if (index == 1) {
						selectImages('', type);
					}
					return true;
				}
			})

		};

		// 头像选择 显示操作表
		var selectImages = function (from, type) {
			var options = {
				quality: 80,
				destinationType: Camera.DestinationType.DATA_URL,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				allowEdit: false,
				encodingType: Camera.EncodingType.JPEG,
				targetWidth: 1000,
				targetHeight: 600,
				correctOrientation: true,
				cameraDirection: 0
			};

			if (from == 'camera') {
				options.sourceType = Camera.PictureSourceType.CAMERA;
			}

			document.addEventListener("deviceready", function () {
				$cordovaCamera.getPicture(options).then(function (imageURI) {
					if (type == 1) { //身份证正
						$scope.pageInfo.img1 = "data:image/jpeg;base64," + imageURI;
						var image1 = document.getElementById('divImg1');
						image1.style.backgroundImage = "url(data:image/jpeg;base64," + imageURI + ")";
					} else if (type == 2) {//身份证反
						$scope.pageInfo.img2 = "data:image/jpeg;base64," + imageURI;
						var image2 = document.getElementById('divImg2');
						image2.style.backgroundImage = "url(data:image/jpeg;base64," + imageURI + ")";
					}
				}, function (error) {
					Message.show('选择失败,请重试.', 1000);
				});
			}, false);
		};

	})

	.controller('myAlipayCtrl', function ($scope, Message, NameBankAlipy, $state) {
		$scope.pageInfo = {
			data: {},
			method: {}
		};

		var _str = '';

		NameBankAlipy.getNBA(function (response) {
			$scope.pageInfo.aliPay = response.data.alipay;
			_str = response.data.alipay;
		}, function (error) {
			Message.show(error.message);
		});

		$scope.pageInfo.method.upInfo = function () {

			if ($scope.pageInfo.aliPay == _str) {
				Message.show('信息未做改变');
				return;
			}

			NameBankAlipy.updataAccount(function (response) {
				Message.show(response.msg);
				if (response.code == 0) {
					$state.go('my-account');
				}
			}, function (error) {
				Message.show(error.message);
			}, $scope.pageInfo.aliPay, 2);
		}
	})


	.controller('myBankCtrl', function ($scope, NameBankAlipy, Message, $state) {
		$scope.pageInfo = {
			bankName: '',
			card: '',
			cardRepeat: '',
			realname: '',
			method: {},
			enableUpdate: false
		};

		NameBankAlipy.getNBA(function (response) {
			$scope.pageInfo.card = response.data.card;
			$scope.pageInfo.bankName = response.data.bankName;
			$scope.pageInfo.realname = response.data.realname;
			if (!$scope.pageInfo.card && !$scope.pageInfo.bankName) {
				$scope.pageInfo.enableUpdate = true;
			}
		}, function (error) {
			Message.show(error.message);
		});

		$scope.pageInfo.method.upInfo = function () {

			if (!$scope.pageInfo.enableUpdate) {
				Message.show('不允许修改，请联系客服更改！');
				return;
			}

			if (!$scope.pageInfo.realname) {
				Message.show('请先实名认证！');
				return;
			}

			if (!$scope.pageInfo.bankName) {
				Message.show('请输入开户行！');
				return;
			}
			if (!$scope.pageInfo.card || $scope.pageInfo.card.length < 12) {
				Message.show('请输入正确的卡号！');
				return;
			}
			if ($scope.pageInfo.card !== $scope.pageInfo.cardRepeat) {
				Message.show('卡号两次输入不一致，请核对卡号！');
				return;
			}

			NameBankAlipy.updataAccount(function (response) {
				Message.show(response.msg);
				if (response.code == 0) {
					$state.go('my-account');
				}
			}, function (error) {
				Message.show(error.message);
			}, $scope.pageInfo, 3);
		};
		$scope.toUpdateName = function () {
			if ($scope.pageInfo.realname) {
				return;
			}
			$state.go("my-name");
		};
	})

	// 修改支付密码
	.controller('mySaveNumCtrl', function ($scope, Auth, User, Message, ENV, $interval, $state) {
		$scope.reg = {captcha: null, mobile: null, safeNum: null, safeNum2: null, number: 60, bol: false};
		$scope.submit = function () {
			if (!ENV.REGULAR_MOBILE.test($scope.reg.mobile)) {
				Message.show('请输入正确的11位手机号');
				return;
			}

			if ($scope.reg.captcha.length != 6) {
				Message.show('请输入正确的6位验证码');
				return;
			}

			if ($scope.reg.safeNum.length != 6) {
				Message.show('请输入正确的6位安全码');
				return;
			}

			if ($scope.reg.safeNum2.length != 6) {
				Message.show('请输入正确的6位确认安全码');
				return;
			}
			if ($scope.reg.safeNum != $scope.reg.safeNum2) {
				Message.show('两次输入不一致，请重新输入');
				return;
			}
			var para = {
				mobile: $scope.reg.mobile,
				captcha: $scope.reg.captcha,
				safeNum: $scope.reg.safeNum,
				safeNum2: $scope.reg.safeNum2
			};

			User.getSafeNum(function (response) {
				if (response.code == 0) {
					Message.show(response.msg, 1500);
					$scope.reg.mobile = '';
					$scope.reg.captcha = '';
					$scope.reg.safeNum = '';
					$scope.reg.safeNum2 = '';
				} else {
					Message.show(response.msg, 1500)
				}
			}, function (error) {
				Message.show(error.message);
			}, para)
		};

		//获取短信验证码
		$scope.getCaptcha = function () {
			Auth.getCaptcha($scope.reg.mobile, 1);
		};

		//发送验证后倒计时
		$scope.$on("Captcha.send", function () {
			$scope.reg.bol = true;
			$scope.reg.number = 60;
			var timer = $interval(function () {
				if ($scope.reg.number <= 1) {
					$interval.cancel(timer);
					$scope.reg.bol = false;
					$scope.reg.number = 60;
				} else {
					$scope.reg.number--;
				}
			}, 1000)
		});
	})

	.controller('userHelpCtrl', function ($scope, Storage, Message, Help) {
		$scope.info = {};

		function getList() {
			Help.getList().then(function (response) {
				$scope.$broadcast('scroll.refreshComplete');
				$scope.info.list = response.data;
				Storage.set('userHelp', response.data);
			}, function () {
				$scope.$broadcast('scroll.refreshComplete');
				Message.show('通讯错误，请检查网络!', 1000);
			})
		}

		$scope.reload = function () { //刷新帮助信息
			getList();
		};

		if (!Storage.get('userHelp')) {
			getList();
		} else {
			$scope.info.list = Storage.get('userHelp');
		}

	})

	.controller('HelpDetailCtrl', function ($scope, Message, Help, $stateParams) {
		$scope.info = {};
		$scope.info.id = $stateParams.id;
		Help.getDetail($scope.info.id).then(function (response) {
			$scope.info.detail = response.data;
		}, function (err) {
			Message.show(err.msg, 1000);
		})
	})


	/*版本中心*/
	.controller('versionCtrl', function ($scope, Storage, Config, Message) {
		$scope.reload = function () {
			getList();
		};
		//getList();

		function getList() {
			Config.fetchVersion(function (repon) {
				$scope.$broadcast('scroll.refreshComplete');
				$scope.version = repon.data;
				Storage.set('version', repon.data);
			}, function () {
				$scope.$broadcast('scroll.refreshComplete');
				Message.show('通讯错误，请稍后重试');
			})
		}

		if (!Storage.get('version')) {
			getList();
		} else {
			$scope.version = Storage.get('version');
		}

	})


    .controller('LoginCtrl', function ($scope, $state, $stateParams, User,
$ionicLoading, Auth, Storage, Message, $rootScope, ENV) {
$scope.$on('$ionicView.beforeEnter', function () {             if
(User.checkAuth()) {                 $state.go('tab.my');
return false;             }         });         $scope.login = {
mobile: '',             password: ''         };         $scope.info = '';
$scope.mobileList=Storage.get("mobileList") || [];         $scope.login =
function () {             if (!ENV.REGULAR_MOBILE.test($scope.login.mobile)) {
Message.show('请输入正确的11位手机号码');                 return false;             }

			if (!$scope.login.password || $scope.login.password.length < 6) {
				Message.show('请输入正确的密码');
				return false;
			}
			Auth.login($scope.login.mobile, $scope.login.password).then(function (res) {
				if (res.code == 0) {
					Message.show('登陆成功', 1500);
					Storage.set("user", res.data);

					$rootScope.globalInfo.data = res.data;
					function IsInArray(arr, val){
						var testStr=','+arr.join(",")+",";
						return testStr.indexOf(","+val+",")!=-1;
					}
					if(!IsInArray($scope.mobileList,$scope.login.mobile)){
						$scope.mobileList.push($scope.login.mobile)
					}
					Storage.set("mobileList",$scope.mobileList);
					$state.go('tab.my');
				}else{
					Message.show(res.msg, 1500);
				}
			})
		};
		$scope.chooseType = function () {
			$scope.mobileType = !$scope.mobileType;
		};
		$scope.selectMobile = function (mobile) {
			$scope.login.mobile = mobile;
			console.log($scope.login.mobile);
			$scope.mobileType = !$scope.mobileType;
		};
		Auth.getUserLogo(function (response) {
			Message.hidden();
			if(response.code == 0){
				$scope.info = response.data;
			}
		},function (error) {
			Message.show(error.message);
		})
	})

	/*初次加载轮播*/
	.controller('oneLoginCtrl', function ($scope, $state, $ionicSlideBoxDelegate, Storage, Auth, Message, User) {
		$scope.$on('$ionicView.beforeEnter', function () {
			if (User.checkAuth()) {
				$state.go('tab.home');
				return false;
			}
			// if (Storage.get('isOneLogin')) {
			// 	$state.go('auth.login');
			// 	return false;
			// }
		});
		$scope.data = {img: {}};
		$scope.$on('$ionicView.enter', function () {
			if (window.StatusBar) {
				StatusBar.hide();
			}
			Auth.getoneLogin(function (response) {
				if (response.data == "") {
					$scope.goIndex();
					return false;
				}
				$scope.data.img = response.data;
				$ionicSlideBoxDelegate.$getByHandle("yindaoPage").loop(false);
				$ionicSlideBoxDelegate.update();
			}, function (error) {
				Message.show('通信错误，请检查网络', 2000);
			});
			$scope.goIndex = function () {
				$state.go('auth.login');
				Storage.set('isOneLogin', '1');
			};
		})
	})

	.controller('ArticleListCtrl', function ($scope) {
		$scope.myVar = true;
		$scope.selectList = '热门';
		$scope.toggle = function () {
			$scope.myVar = !$scope.myVar;
		};
		$scope.lists = ['热门', '推荐', '段子手', '养生堂'];
		$scope.mores = ['私房话', '八卦精', '百事通', '财经迷', '汽车迷', '科技咖'];
		$scope.active = function (name) {
			$scope.selectList = name;
		};

		$scope.addList = function (_index) {
			var _popX = $scope.lists.pop();
			var _popH = $scope.mores.splice(_index, 1).toString();
			$scope.mores.push(_popX);
			$scope.lists.push(_popH);
			$scope.selectList = _popH;
			$scope.myVar = !$scope.myVar;
		};

		$scope.go = function () {
		}
	})
	.controller('ArticleDetailCtrl', function ($scope) {
		console.log(222)
	})

	.controller('RegisterCtrl', function ($scope, Auth, $interval, Message, ENV) {
		$scope.reg = {captcha: null, mobile: null, password: null, repassword: null, number: 60, bol: false};
		$scope.showNext = false;
		Auth.getUserLogo(function (response) {
			Message.hidden();
			if(response.code== 0){
				$scope.info = response.data
			}
		},function (error) {
			Message.show(error.message);
		})
		//获取短信验证码
		$scope.getCaptcha = function () {
			Auth.getCaptcha($scope.reg.mobile);
		};

		// 提交
		$scope.registerSubmit = function () {
			if(!$scope.reg.captcha){
				Message.show('请输入验证码');
				return
			}
			Auth.setPassword($scope.reg);
		};
		//发送验证后倒计时
		$scope.$on("Captcha.send", function () {
			$scope.reg.bol = true;
			$scope.reg.number = 60;
			var timer = $interval(function () {
				if ($scope.reg.number <= 1) {
					$interval.cancel(timer);
					$scope.reg.bol = false;
					$scope.reg.number = 60;
				} else {
					$scope.reg.number--;
				}
			}, 1000)
		});
	})

	.controller('ResetPsdCtrl', function ($scope, Auth, $interval, Message) {
		$scope.reg = {captcha: null, mobile: null, password: null, rePassword: null, number: 60, bol: false};
		$scope.showNext = false;

		//获取短信验证码
		$scope.getCaptcha = function () {
			Auth.getCaptcha($scope.reg.mobile, 1);
		};

		// 验证验证码
		$scope.forgetPsw = function () {
			if(!$scope.reg.captcha){
				Message.show('请输入验证码');
				return
			}

			Auth.setPassword($scope.reg, 1);
		};

		//验证成功后
		$scope.$on("Captcha.success", function () {
			$scope.showNext = true;
		});

		//发送验证后倒计时
		$scope.$on("Captcha.send", function () {
			$scope.reg.bol = true;
			$scope.reg.number = 60;
			var timer = $interval(function () {
				if ($scope.reg.number <= 1) {
					$interval.cancel(timer);
					$scope.reg.bol = false;
					$scope.reg.number = 60;
				} else {
					$scope.reg.number--;
				}
			}, 1000)
		});
	})

	.controller('offlinePayCtrl', function ($scope, Shop, $stateParams, Message, $window, $timeout, Payment, $state) {
		$timeout(function () {
			$window.document.getElementById('off_pay_price').focus();
		},1000);
		Shop.payonLine(function (res) {
			if(res.code == 0){
				$scope.info = res.data
			}else if(res.code == 1){
				Message.show(res.msg)
			}
		},function () {

		}, $stateParams.spid);
		$scope.paySure = function (money) {
			console.log(money);
			if(!money){
				Message.show('请输入消费金额！');
				return
			}
			Payment.getOrderInfo('offline',money, $stateParams.spid).then(function (res) {
				if(res.code == 0){
					$state.go('mall.payStyle',{orderId:res.data, type: 'offline'});
				}else if(res.code == 1){
					Message.show(res.msg)
				}
			})
		}
	})

	.controller('balanceListCtrl', function ($scope, Credit, Shop, $stateParams, Message, $ionicLoading, $timeout, User, $state) {
		$scope.info = {list:''};
		$scope.orderEmpty = false;
		$scope.myVar = false;

		$scope.type = $stateParams.type;
		if($scope.type == 'red'){
			$scope.title = '积分'
			$scope.status = 1;
		}else if($scope.type == 'balance'){
			$scope.title = '余额'
		}else if($scope.type == 'point'){
			$scope.title = '经销商';
			$scope.status = 1;
		}
		$scope.rebate = function (num) {
			$scope.status = num; 
			User.completeRebate(function (res) {
				if(res.code == 0){
					$scope.order = res.data.list;
					$scope.orderEmpty = false;
				}else if(res.code == 1){
					$scope.orderEmpty = true;
				}
			});
		};
		$scope.selectTab = function (num) {
			$scope.status = num;
			common()
		};
		function common() {
			Credit.getCredit($stateParams.type, $scope.status).then(function (res) {
				$scope.info = res.data;
				if(res.code == 0){
					$scope.orderEmpty = false;
				}else if(res.code == 1){
					$scope.orderEmpty = true
				}
			});
		}
		common();
		
		$scope.selectAgent = function(type){
			$scope.status = type;
			agent(type);
		}
		function agent(type) {
			User.recUser(function (response) {
				$scope.agentList = response.data;
			}, function (error) {
				Message.show(error.message);
			}, type);
		}
		agent(1);
		$scope.creditWithdraw = function () {
			$state.go('user.balaWithdraw')
		};
		$scope.creditCharge = function () {
			$state.go('user.myBalance')
		};
		// 下拉刷新
		$scope.doRefresh = function () {
			Credit.getCredit($stateParams.type, $scope.status).then(function (response){
				$scope.info = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				},1200);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1500'
				});
				$scope.page = 2;
			});
			User.completeRebate($stateParams.type, $scope.status).then(function (response){
				$scope.info = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				},1200);
				$scope.page = 2;
			});
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Credit.getCredit($stateParams.type, $scope.status, $scope.page).then(function (response) {
				if(response.code == 0){
					$scope.page++;
					$scope.info = $scope.info.concat(response.data);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1200)
				}else if (response.code != 0) {
					$scope.noMore = false;
				}
			}); 
			User.completeRebate(function (res) {
				if(res.code == 0){
					$scope.page++;
					$scope.order = $scope.order.concat(res.data.list);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1200)
				}else if(res.code == 1){
					$scope.noMore = false;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}
			});
		};
	})

	.controller('balaWithdrawCtrl', function ($scope, User, $stateParams, Message, $ionicPopover, $timeout, Payment, $state, $interval) {
		$scope.giveMoney = {user:{bankName: '', bankNameNo: '', card: '', alipay: '',code: '',realname: '',teamNum: ''}};
		$scope.info = {payType: '', payTitle: '', money: '',code: ''};
		User.huoMoney(function(response){
			Message.hidden();
			if(response.code == 0){
				$scope.giveMoney = response.data;
			}else{
				Message.show(response.msg)
			}
		},function(error){
			Message.show(error.msg);
		},'get');
		// 筛选遮罩层
		$ionicPopover.fromTemplateUrl('templates/modal/withType.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});
		$scope.selectType = function () {
			$scope.popover.show();
		};
		$scope.selectOption = function (type,title) {
			$scope.popover.hide();
			$scope.info.payType = type;
			$scope.info.payTitle = title
		};
		function common() {
			if (!$scope.info.payType) {
				Message.show('请选择提现方式！');
				return false;
			}
			if (!$scope.info.money) {
				Message.show('请填写提现金额！');
				return false;
			}
			if (!$scope.giveMoney.user.realname) {
				Message.show('请填写真实姓名！');
				return false;
			}
			if ($scope.info.payType == 'bank' && !$scope.giveMoney.user.bankName) {
				Message.show('请填写所属银行！');
				return false;
			}
			if ($scope.info.payType == 'bank' && !$scope.giveMoney.user.card) {
				Message.show('请填写银行卡号！');
				return false;
			}
			if ($scope.info.payType == 'bank' && !$scope.giveMoney.user.bankNameNo) {
				Message.show('请填写开户行！');
				return false;
			}else{
				return true
			}
			if ($scope.info.payType == 'alipay' && !$scope.giveMoney.user.alipay) {
				Message.show('请填写支付宝账号！');
				return false;
			}else{
				return true
			}
			if ($scope.info.payType == 'wechat' && !$scope.giveMoney.user.teamNum) {
				Message.show('请填写微信账号！');
				return false;
			}else{
				return true
			}
		}
		$scope.getCaptchaSuccess = false;
		$scope.reg= {
			number: 60
		};
		$scope.getCaptcha = function () {
			if(common()){
				User.huoMoney(function (res) {
					if(res.code == 0){
						$scope.getCaptchaSuccess = true;
						var timer = $interval(function () {
							if ($scope.reg.number <= 1) {
								$interval.cancel(timer);
								$scope.getCaptchaSuccess = false;
								$scope.reg.number = 60;
							} else {
								$scope.reg.number--;
							}
						}, 1000)
					}else{
						Message.show(res.msg)
					}
				},function () {

				},'code');
			}
		};
		$scope.withSub = function () {
			User.huoMoney(function(response){
				Message.hidden();
				if(response.code == 0){
					$state.go('user.withRecords',{type: 'balance'});
					$timeout(function () {
						Message.show('提交成功，请耐心等待审核')
					}, 1200)
				}else if(response.code == 1){
					Message.show(response.msg)
				}
			},function(error){
				Message.show(error.msg);
			},'save', $scope.info, $scope.giveMoney.user);
		}
	})

	.controller('balanceAttornCtrl', function ($scope, Credit, $stateParams, Message, $ionicPopup, $timeout, ENV, $interval, Payment, $state) {
		$scope.info = {};
		$scope.giveInfo = {};
		$scope.type = $stateParams.type;
		$scope.getCaptchaSuccess = false;
		$scope.reg= {
			number: 60
		};
		Credit.getAttorn('get',$stateParams.type).then(function (data) {
			$scope.info = data
		});
		$scope.getCaptcha = function () {
			if(common()){
				Credit.getAttorn('code').then(function () {
					$scope.getCaptchaSuccess = true;
					var timer = $interval(function () {
						if ($scope.reg.number <= 1) {
							$interval.cancel(timer);
							$scope.getCaptchaSuccess = false;
							$scope.reg.number = 60;
						} else {
							$scope.reg.number--;
						}
					}, 1000)
				});
			}
		};
		function common() {
			if(!$scope.giveInfo.mobile || !ENV.REGULAR_MOBILE.test($scope.giveInfo.mobile)){
				Message.show('请输入消费商家手机号');
				return
			}
			if(!$scope.giveInfo.giveNum){
				Message.show('请输入转让数量');
			}else{
				return true
			}
		}
		$scope.submit = function () {
			$ionicPopup.confirm({
				title: '请确认转让信息',
				template: '是否向:'+$scope.giveInfo.mobile+',转让'+$scope.giveInfo.giveNum+'？',
				buttons: [
					{
						text: '取消', onTap: function () {
						return false;
					}
					},
					{
						text: '确定', type: 'button-assertive', onTap: function () {
						Credit.getAttorn('save', $scope.giveInfo);
					}
					}
				]
			})
		}
	})

	.controller('shopCenterCtrl', function ($scope, Shop, $stateParams, Message, $rootScope) {
		$scope.info = {};
		Shop.getShopModel(function (res) {
			if(res.code == 0){
				$scope.info = res.data
			}else if(res.code == 1){
				Message.show(res.msg)
			}
		},function () {

		}, $rootScope.globalInfo.data.isDappShop)
	})

	.controller('shopQrcodeCtrl', function ($scope, Shop, $timeout, $state, Message, $rootScope) {
		Shop.getshopQrcode(function(res){
			if(res.code == 301){
				$scope.QRcode = res.data;
			}else if(res.code == 1){
				Message.show(res.msg)
			}
		},function(){},$rootScope.globalInfo.data.isDappShop);
		Shop.getshopInfo(function(res){
			if(res.code == 0){
				$scope.info = res.data;
			}else if(res.code == 1){
				Message.show(res.msg)
			}
		},function(){},$rootScope.globalInfo.data.isDappShop)
	})

	.controller('shopWithdrawCtrl', function ($ionicPopover, $scope, Shop, $stateParams, Message, $ionicPopup, $timeout, Payment, $state) {
		$scope.info = {historyUser:'', shopInfo:''};
		$scope.shopInfo = {cname: '', mobile: ''};
		$scope.showBank = false
		Shop.shopWithdraw(function (res) {
			if(res.code == 0){
				$scope.info = res.data;
				if($scope.info.historyUser == ''){
					$scope.shopInfo.cname = $scope.info.shopInfo.cname;
					$scope.shopInfo.mobile = $scope.info.shopInfo.mobile;
				}else{
					$scope.shopInfo.cname = $scope.info.historyUser.cname;
					$scope.shopInfo.mobile = $scope.info.historyUser.mobile;
				}
			}
		}, function (error) {
			Message.show(error.message)
		}, 'get');
		$ionicPopover.fromTemplateUrl('templates/modal/withType.html', {
			scope: $scope
		}).then(function (popover) {
			$scope.popover = popover;
		});
		$scope.selectType = function (title) {
			$scope.popover.show();
			if(title == 'bank'){
				$scope.title = '开户行';
				$scope.showBank = true
			}else{
				$scope.showBank = false
			}
		};
		$scope.selectOption = function (type, title, model) {
			$scope.popover.hide();
			if(model == 'bank'){
				$scope.info.cardType = title
			}else{
				$scope.info.withdrawType = type;
				$scope.info.withdrawTitle = title
			}
		}
		$scope.withSure = function () {
			var pas = {
				cname: $scope.shopInfo.cname,
				mobile: $scope.shopInfo.mobile,
				uname: $scope.info.historyUser.uname,
				username: $scope.info.historyUser.username,
				withType:$scope.info.withdrawType,
				cardType:$scope.info.cardType,
				cardInfo:$scope.info.historyUser.cardInfo,
				price: $scope.info.money,
			};
			if(!$scope.shopInfo.cname){
				Message.show('请填写商家负责人！');
				return
			}
			if(!$scope.info.historyUser.uname){
				Message.show('请填写姓名！');
				return
			}
			if(!$scope.shopInfo.mobile){
				Message.show('请填写联系电话！');
				return
			}
			if(!$scope.info.money){
				Message.show('请输入提现金额！');
				return
			}
			if(!$scope.info.withdrawType){
				Message.show('请选择提现方式！');
				return
			}
			if($scope.info.withdrawType == 2){
				if (!$scope.info.cardType) {
					Message.show('请选择开户行！');
					return false;
				}
				if (!$scope.info.historyUser.cardInfo) {
					Message.show('请填写开户行信息！');
					return false;
				}
			}
			if (!$scope.info.historyUser.username) {
				Message.show('请填写账号！');
				return false;
			}
			Shop.shopWithdraw(function (response) {
				if(response.code == 0){
					Message.show('提交成功！');
					$timeout(function () {
						$state.go('shop.withdrawList')
					},1000)
				}else if(response.code == 1){
					Message.show(response.msg);
				}
			}, function (error) {
				Message.show(error.message)
			},'save', pas)
		}
	})

	.controller('shopWithdrawListCtrl', function ($ionicPopover, $scope, Shop, $stateParams, Message, $ionicLoading, $timeout, Payment, $state) {
		$scope.shopWithdraw = {};
		$scope.orderEmpty = false;
		Shop.shopWithdrawList(function (response) {
			if(response.code == 0){
				$scope.shopWithdraw = response.data;
				$scope.orderEmpty = false;
			}else if(response.code == 1){
				Message.show(response.msg);
				$scope.orderEmpty = true;
			}
		}, function (error) {
			Message.show(error.message)
		});
		// 下拉刷新
		$scope.doRefresh = function () {
			Shop.shopWithdrawList(function (response){
				$scope.shopWithdraw = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				},1200);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1500'
				});
				$scope.page = 2;
			},function () {

			});
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Shop.shopWithdrawList(function (response) {
				if(response.code == 0){
					$scope.page++;
					$scope.shopWithdraw = $scope.shopWithdraw.concat(response.data);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1200)
				}else if (response.code != 0) {
					$scope.noMore = false;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}
			},function () {

			},$scope.page);
		};
	})

	.controller('moneyInfoCtrl', function ($scope, Shop, $stateParams, Message) {
		$scope.shopOrder = {};
		Shop.shopOrderInfo(function (response) {
			if(response.code == 0){
				$scope.shopOrder = response.data;
			}else if(response.code == 1){
				Message.show(response.msg);
			}

		}, function (error) {
			Message.show(error.message)
		})
	})

	.controller('onOrderListCtrl', function ($scope, Shop, $stateParams, Message, $ionicPopup, $timeout, $ionicLoading, $state) {
		$scope.orderList = {};
		$scope.info = {num:''};
		$scope.orderEmpty = false;
		function common(num) {
			Shop.shopOrderList(function (response) {
				if(response.code == 0){
					$scope.orderList = response.data;
					$scope.orderEmpty = false;
				}else if(response.code == 1){
					// Message.show(response.msg);
					$scope.orderEmpty = true;
				}
			}, function (error) {
				Message.show(error.message);
			}, num);
		}
		common();
		// 搜索订单
		$scope.searchOrderList = function(){
			if($scope.info.num == ''){
				Message.show('请输入订单编号！');
				return false;
			};
			common($scope.info.num)
		};
		// 下拉刷新
		$scope.doRefresh = function () {
			Shop.shopOrderList(function (response){
				$scope.orderList = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$scope.noMore = false;
				$timeout(function () {
					$scope.noMore = true;
				},1200);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1500'
				});
				$scope.page = 2;
			},function () {

			});
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Shop.shopOrderList(function (response) {
				if(response.code == 0){
					$scope.page++;
					$scope.orderList.order = $scope.orderList.order.concat(response.data.order);
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.noMore = false;
					$timeout(function () {
						$scope.noMore = true;
					},1200)
				}else if (response.code != 0) {
					$scope.noMore = false;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}
			},function () {

			},$scope.page);
		};
	})

	.controller('offOrderListCtrl', function ($scope, Oto, Shop, Mc, User,$stateParams, Message, $ionicPopup, $timeout, $state, $ionicLoading) {
		$scope.type = $stateParams.type;
		$scope.orderEmpty = false;
		var common;
		$scope.toBack = function () {
			$state.go('tab.my')
		};
		Mc.getUserInfo(function (response) {
			Message.hidden();
			if(response.code == 0){
				$scope.pageInfo = response.data;
			}else{
				Message.show(response.msg)
			}
		}, function (error) {
			Message.show(error.message);
		});
		User.underList(function (res) {
			if(res.code == 0){
				$scope.order = res.data.orderList;
				$scope.orderEmpty = false;
			}else if(res.code == 1){
				$scope.orderEmpty = true;
			}
		});
		$scope.creditWithdraw = function () {
			$state.go('user.balaWithdraw')
		};
		$scope.creditCharge = function () {
			$state.go('user.myBalance')
		};
		// 列表下拉刷新
		$scope.doRefresh = function () {
			User.underList(function (response) {
				$scope.noMore = false; //下拉加载时避免上拉触发
				$scope.order = response.data.orderList;
				$timeout(function () {
					$scope.noMore = true;
				}, 1500);
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			});
		};
		// 下拉加载更多商家
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.underList(function (response) {
				if(response.code == 0){
					$scope.page++;
					$scope.order = $scope.order.concat(response.data.orderList);
					$scope.$broadcast('scroll.refreshComplete');
				}else{
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
					$scope.noMore = false;
				}
			});
		};
	})

	.controller('offOrderDetailCtrl', function ($scope, Oto,$stateParams, Message, $ionicPopup, $timeout, $state) {
		$scope.id = $stateParams.id;
		$scope.type = $stateParams.type;
		$scope.order = {};
		var common;
		if($scope.type == 'user'){
			common = Oto.userOtoOrderDetail
		}else if($scope.type == 'shop'){
			common = Oto.shopOtoOrderDetail
		}
		common($scope.id).then(function (res) {
			if(res.code == 0){
				$scope.order = res.data;
				if(res.data.list == ''){
					$scope.orderEmpty = true;
				}else{
					$scope.orderEmpty = false;
				}
			}else if(res.code == 1){
				$scope.orderEmpty = true;
			}
		});

	})

	.controller('shopOrderDetailCtrl', function ($scope, Shop, $stateParams, Message) {
		$scope.orderDetail = {};
		$scope.id = $stateParams.id;
		$scope.spid = $stateParams.spid;
		Shop.shopOrderDetail(function (response) {
			$scope.orderDetail = response.data;
		}, function (error) {
			Message.show(error.message)
		},$scope.id, $scope.spid);
	})

	.controller('applyAgentCtrl', function ($scope, User, $stateParams, Payment, Message, $state, $timeout, $ionicPopup, $ionicPopover, Area, $ionicScrollDelegate) {
		$scope.userInfo = {area:''};
		$scope.cities = {};
		$scope.districts = {};
		// 筛选
		Area.getList(function (data) {
			$scope.areaList = $scope.areaData = data;
		});
		$scope.proToPro = function (id,str) {
			var pid = id.substr(0, 2) + "0000";
			var cid = id.substr(0, 4) + "00";
			if (id.substr(0, 2) != "00") {
				$scope.cities = $scope.areaData[pid]['cities'];
				$scope.province = $scope.areaData[pid].title;
				$scope.area.city = $scope.cities[0];
				$scope.area.districts = $scope.cities[0];
				return true;
			}
		};

		$scope.proToCity = function (id) {
			var pid = id.substr(0, 2) + "0000";
			var cid = id.substr(0, 4) + "00";
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00") {
				$scope.districts = $scope.areaData[pid]['cities'][id]['districts'];
				$scope.city = $scope.areaData[pid]['cities'][cid].title;
				$scope.area.districts = $scope.districts[0];
				return true;
			}
		};
		$scope.info = {name: '', mobile: ''};
		$scope.applySub = function () {
			if(!$scope.userInfo.realname){
				Message.show('请输入真实姓名');
				return
			}
			if(!$scope.userInfo.mobile){
				Message.show('请输入联系电话');
				return
			}
			User.applyAgent($scope.userInfo).then(function (response) {
				Message.hidden();
				if (response.code == 0) {
					$state.go('tab.my');
					$timeout(function () {
						Message.show(response.msg)
					}, 1200)
				} else if (response.code == 1) {
					Message.show(response.msg);
				}
			})
		};
	})

	.controller('LanguagesCtrl',function ($scope, User, $translate, Auth, $state, $stateParams) {
	    $scope.$on('$ionicView.beforeEnter', function () {
			if (User.checkAuth()) {
				$state.go('tab.my');
				return false;
			}
		});
	    $scope.switching = function(lang){
	        $translate.use(lang);
	        window.localStorage.lang = lang;
	        $scope.type = $stateParams.type;
	        if($scope.type == 2){
	        	$state.go('auth.register');
	        }else{
	        	$state.go('auth.login');
	        	return false;
	        }
	        window.location.reload();
	    };
	    $scope.type = $translate.use();
	});

