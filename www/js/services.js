angular.module('starter.services', [])
	.factory('Storage', function () {
		return {
			set: function (key, data) {
				return window.localStorage.setItem(key, window.JSON.stringify(data));
			},
			get: function (key) {
				return window.JSON.parse(window.localStorage.getItem(key));
			},
			remove: function (key) {
				return window.localStorage.removeItem(key);
			}
		};
	})

	.factory('Auth', function ($resource, $rootScope, ENV, Message, $state, Storage, $q) {
		var resource = $resource(ENV.API_URL + '?do=auth', {}, {
			query: {
				method: 'post',
				params: {
					op: '@op'
				},
				timeout: 6500
			}
		});

		function checkMobile(mobile) {
			if (!ENV.REGULAR_MOBILE.test(mobile)) {
				Message.show('请输入正确的11位手机号', 800);
				return false;
			}
			return true;
		}

		function checkPwd(pwd) {
			if (!pwd || pwd.length < 6) {
				Message.show('请输入正确的密码(最少6位)', 800);
				return false;
			}
			return true;
		}

		return {
			getoneLogin: function (success, error) {
				var res = $resource(ENV.API_URL + '?do=api');
				res.save({op: 'nav'}, success, error);
			},
			login: function (mobile, password) {
				var deferred = $q.defer();
				// if (!checkMobile(mobile)) {
				// 	return false;
				// }
				// if (!checkPwd(password)) {
				// 	return false;
				// }
				Message.loading('登陆中……');
				resource.save({
					op: 'login',
					mobile: mobile,
					password: password
				}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},

			//获取验证码
			getCaptcha: function (mobile, type) {
				if (!checkMobile(mobile)) {
					return false;
				}
				var _json = {
					op: 'register',
					type: 'send',
					mobile: mobile
				};
				if (type) {
					_json = {
						op: 'forget',
						type: 'send',
						mobile: mobile
					}
				}
				Message.loading();
				resource.query(_json, function (response) {
					if (response.code !== 0) {
						Message.show(response.msg);
						return false;
					}
					$rootScope.$broadcast('Captcha.send');
					Message.show(response.msg, 1000);
				}, function () {
					Message.show('通信错误，请检查网络!', 1500);
				});
			},

			//检查验证码
			checkCaptain: function (mobile, captcha, type) {
				if (!checkMobile(mobile)) {
					return false;
				}
				var _json = {
					op: 'register',
					type: 'verifycode',
					mobile: mobile,
					code: captcha
				};

				if (type) {
					_json = {
						op: 'forget',
						type: 'verifycode',
						mobile: mobile,
						code: captcha
					};
				}

				Message.loading();

				return resource.query(_json, function (response) {
					if (response.code !== 0) {
						Message.show(response.msg, 1500);
						return;
					}
					$rootScope.$broadcast('Captcha.success');
					Message.show(response.msg, 1000);
				}, function () {
					Message.show('通信错误，请检查网络！', 1500);
				});
			},

			/*设置密码*/
			setPassword: function (reg, type) {
				if(!reg.mobile || !ENV.REGULAR_MOBILE.test(reg.mobile)){
					Message.show('请输入正确的手机号');
					return
				}
				if(!reg.password || !ENV.REGULAR_PASSWORD.test(reg.password)){
					Message.show('请设置6至16位数字字母组合密码');
					return
				}
				if(type == 1){
					if(reg.password != reg.rePassword){
						Message.show('两次密码不一致');
						return
					}
				}
				var _json = {
					op: 'register',
					mobile: reg.mobile,
					tMobile: reg.tMobile,
					password: reg.password,
					repassword: reg.password,
					code: reg.captcha
				};

				if (type) {
					_json = {
						op: 'forget',
						mobile: reg.mobile,
						password: reg.password,
						repassword: reg.rePassword,
						code: reg.captcha
					};
				}

				Message.loading();
				return resource.query(_json, function (response) {
					Message.show(response.msg, 1500);
					if (response.code == 0) {
						$state.go('auth.login');
					}
				}, function () {
					Message.show('通信错误，请检查网络！', 1500);
				});
			},
			// 获取头像
			getUserLogo: function (success, error) {
				var res = $resource(ENV.API_URL + '?do=api');
				// Message.loading();
				res.get({op: 'logo'}, success, error);
			}
		}
	})

	.factory('User', function ($resource, $rootScope, $q, $ionicLoading, ENV, $state, Message, $timeout, Storage, md5) {
		var userInfo = {};
		return {
			checkAuth: function () {
				if (Storage.get('user') && Storage.get('user').uid != '') {
					return true;
				} else {
					return false;
				}
			},

			logout: function (type) {
				Storage.remove('user');
				if (type) {
					Message.show('密码修改成功，请重新登陆！',1000);
					$timeout(function(){
						$state.go("auth.login");
					},1000)
					// Message.show('密码修改成功，请重新登陆！', '1500', function () {
					// 	$state.go("auth.login");
					// });
				} else {
					Message.show('退出成功！', '1500', function () {
						$rootScope.$broadcast('userQuit');
						$state.go("auth.login");
					});
				}
			},
			// 修改登录密码
			updatapswcode: function (pasa) {
				var resource = $resource(ENV.API_URL + '?do=user');
				var _json = {};
				Message.loading();
				var deferred = $q.defer();
				_json = {
					op: 'updatePassword',
					type: 'send',
					userPassword: pasa.oldpsd,
					password: pasa.newpsd,
					repassword: pasa.respsd
				}
				resource.get(_json, function (response) {
					Message.hidden();
					if (response.code == 0) {
						deferred.resolve(response.data);
						Message.show(response.msg);
					}else{
						Message.show(response.msg);
					}
				}, function () {
					Message.show('通信错误，请检查网络!', 1500);
				});
				return deferred.promise;
			},
			underList: function (success,error,page) {
				var res = $resource(ENV.API_URL + '?do=user');
				//Message.loading();
				page = page || 1;
				res.save({op: 'creditInfo', page: page},success,error);
				// return deferred.promise;
			},
			completeRebate: function (success,error,page) {
				var res = $resource(ENV.API_URL + '?do=user');
				//Message.loading();
				page = page || 1;
				res.get({op: 'completeRebate', page: page},success,error);
				// return deferred.promise;
			},
			// 修改支付密码
			setPayPassword: function (_t, pasa) {
				var resource = $resource(ENV.API_URL + '?do=user');
				var _json = {};
				Message.loading();
				var deferred = $q.defer();
				if(_t == 'save'){
					_json = {
						op: 'setPayPassword',
						mobile: pasa.mobile,
						safePassword: pasa.newpsd,
						reSafePassword: pasa.respsd,
					}
				}else if(_t == 'code'){
					_json = {
						op: 'setPayPassword',
						type: 'send'
					}
				}

				resource.get(_json, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			//获取/修改个人信息
			saveAvatar: function (success, error,data, area) {
				var resource = $resource(ENV.API_URL + '?do=user');
				// Message.loading('请求中...');
				var _json;
				console.log(data,area)
				if(area == 'save'){				//修改信息
					 _json = {
					 	  op:'newUserInfo',
						  avatar:data.avatar,
						  nickname: data.nickname,
						  gender:data.gender,
						  type:area
					 }
				}else{     //获取信息
					 _json = {
						 op:'newUserInfo',
						 type:''
					}
				}
				resource.save(_json, success, error);
			},

			getCurrentUser: function () {
				if (!this.checkAuth()) {
					$ionicLoading.show({
						noBackdrop: true,
						template: '请登陆后操作！',
						duration: '1000'
					}).then(function () {
						$state.go("auth.login", {forward: forward})
					});
				}
				return Storage.get('user') || {};
			},

			getSignature: function () {
				userInfo = this.getCurrentUser();
				var timestamp = Math.round(new Date() / 1000);
				var signature = md5.createHash(userInfo.uid + '' + timestamp + '' + userInfo.token);
				return {timestamp: timestamp, signature: signature} || {};
			},

			getOrderList: function (_t, status, page) {
				if(_t == 'get'){
					// Message.loading();
				}
				var res = $resource(ENV.API_URL + '?do=order');
				var deferred = $q.defer();
				page = page || 1;
				var _json = {
					op: 'display',
					status: status,
					page: page
				};
				res.get(_json, function (response) {
					Message.hidden();
					deferred.resolve(response);
				}, function () {
					Message.show('通信错误，请检查网络!', 1500);
				});
				return deferred.promise;
			},

			getOrderListDetail: function (success, error, orderSn) {
				// Message.loading();
				var res = $resource(ENV.API_URL + '?do=order');
				res.get({op: 'detail', orderSn: orderSn}, success, error);
			},

			getAgent: function (success, error) {
				var res = $resource(ENV.API_URL + '?do=agent');
				res.get({op: 'display'}, success, error);
			},
			recUser: function (success, error, type, page) {
				var res = $resource(ENV.API_URL + '?do=user');
				page = page || 1;
				res.get({op: 'recUser', type: type,page: page}, success, error);
			},

			// 佣金明细
			getAgentList: function (success, error, type, page) {
				var res = $resource(ENV.API_URL + '?do=agent');
				page = page || 1;
				res.get({op: 'list', type: type, page: page}, success, error);
			},
			// 我的团队
			getTeam: function (success, error, level, uid, page) {
				var res = $resource(ENV.API_URL + '?do=agent');
				page = page || 1;
				res.get({op: 'level', level: level, uid: uid, page: page}, success, error);
			},
			// 用户提现
			userWithdraw: function (success, error) {
				var res = $resource(ENV.API_URL + '?do=agent');
				res.get({op: 'withdraw'}, success, error)
			},
			userWithdrawSuccess: function (success, error, pas) {
				var res = $resource(ENV.API_URL + '?do=agent');
				Message.loading();
				res.save({
					op: 'withdraw',
					type: pas.withType,
					money: pas.money,
					username: pas.username,
					mobile: pas.mobile,
					card: pas.card,
					cardType: pas.cardType,
					alipay: pas.alipay,
					types: 'save',
				},success, error)
			},
			// 提现列表
			userWithdrawList: function (success, error, page) {
				var res = $resource(ENV.API_URL + '?do=agent');
				Message.loading();
				page = page || 1;
				res.get({op: 'withdrawList', page: page}, success, error)
			},
			// 我的余额
			getCredit: function (success, error, type, page) {
				var res = $resource(ENV.API_URL + '?do=credit');
				var _json = {};
				if (type == 'balance') {
					_json = {
						op: 'credit',
						type: type,
						page: page
					}
				} else if (type == 'red') {
					_json = {
						op: 'red',
						type: type,
						page: page
					}
				} else if (type == 'point') {
					_json = {
						op: 'point',
						type: type,
						page: page
					}
				}
				res.get(_json, success, error)
			},
			// 我的足迹
			getCollectShops: function (success, error, type, id, del, page) {
				var res = $resource(ENV.API_URL + '?do=mc');
				var _json = {};
				// Message.loading();
				if (del) {
					if (type == 'shopFollow') {
						_json = {
							op: 'delGoodsShop',
							id: id,
							type: 'shops'
						}
					} else if (type == 'goodsLike') {
						_json = {
							op: 'delGoodsShop',
							id: id,
							type: 'goods'
						}
					} else if (type == 'click') {
						_json = {
							op: 'delGoodsShop',
							id: id,
							type: 'clicks'
						}
					}

				} else {
					if (type == 'shopFollow') {
						_json = {
							op: 'shopFollow',
							type: type,
							page: page
						}
					} else if (type == 'goodsLike') {
						_json = {
							op: 'goodsLike',
							type: type,
							page: page
						}
					} else if (type == 'click') {
						_json = {
							op: 'goodsClick',
							type: type,
							page: page
						}
					}
				}

				res.get(_json, success, error)
			},
			// 我的二维码
			getQRcode: function (success, error) {
				var res = $resource(ENV.API_URL + '?do=api');
				res.get({op: 'download'}, success, error)
			},
			// 取消或删除订单
			cancelOrder: function (success, error, orderId, pas) {
				var res = $resource(ENV.API_URL + '?do=order');
				var _json = {};
				if (pas == 'cancel') {
					_json = {
						op: 'remove',
						'orderId': orderId,
					}
				} else if (pas == 'delete') {
					_json = {
						op: 'delete',
						'orderId': orderId,
					}
				}else if(pas == 'confirm') {
					_json = {
						op: 'saveDis',
						'orderId': orderId
					}
				}
				res.get(_json, success, error);
			},
			// 立即支付
			paymentOrder: function (success, error, payTypeOp, orderId) {
				var res = $resource(ENV.API_URL + '?do=payment');
				res.get(
					{
					op: payTypeOp,
					orderId: orderId,
					}, success, error)
			},
			// 申请退货信息列表
			returnGoods: function (success, error, orderSn, goodsInfo,expressNo) {
				Message.loading();
				var res = $resource(ENV.API_URL + '?do=order');
				var _json = {
					op: 'returnGoodsInfo',
					orderSn: orderSn,
					express: goodsInfo,
					expressNo: expressNo,
					type: 'save'
				};
				res.get(_json, function (response) {
					Message.hidden();
					if (response.code == 0) {
						Message.show(response.msg);
						$timeout(function () {
							$state.go('tab.my')
						}, 1500);
					} else if (response.code != 0) {
						Message.show(response.msg);
					}
				}, error)
			},
			//申请退货提交
			returnsub:function(success, error, orderSn, goodsInfo, price, goodsList,thumbs, priceStatus){
				console.log(goodsInfo);
				console.log(priceStatus);
				Message.loading();
				var res = $resource(ENV.API_URL + '?do=order');
				var _json = {
					op: 'returnGoodsInfo',
					orderSn: orderSn,
					goodsInfo: goodsInfo,
					price: price,
					goodsList: goodsList,
					thumbs:thumbs,
					priceStatus: priceStatus,
					type: 'save'
				};
				res.save(_json, function (response) {
					Message.hidden();
					if (response.code == 0) {
						Message.show(response.msg);
						$timeout(function () {
							$state.go('mall.order',{status:5});
						}, 1500);
					} else if (response.code != 0) {
						Message.show(response.msg);
					}
				}, error)
			},
			// 取消退货
			cancelReturnGoods: function (orderSn) {
				var resource = $resource(ENV.API_URL + '?do=order');
				var deferred = $q.defer();
				Message.loading();
				resource.save({op: 'cancelReturnGoods', orderSn: orderSn}, function (response) {
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			//修改支付密码
			getSafeNum: function (success, error, para) {
				var resource = $resource(ENV.API_URL + '?do=user');
				var _json = {
					op: "setPayPassword",
					mobile: para.mobile,
					code: para.captcha,
					safePassword: para.safeNum,
					reSafePassword: para.safeNum2
				};
				resource.save(_json, success, error);
			},

			// 修改登录密码
			changeLoginPsd: function (oldpsd, code, newpsd, respsd) {
				Message.loading();
				var deferred = $q.defer();
				var _json = {
					op: 'updatePassword',
					userPassword: oldpsd,
					code: code,
					password: newpsd,
					repassword: respsd
				};
				resource.save(_json, function (response) {
					Message.hidden();
					if (response.code == 0) {
						deferred.resolve(response.data);
					}else if(response.code == 301){
						Message.show(response.msg);
						$state.go('user.center');
					}else{
						Message.show(response.msg);
					}
				}, function () {
					Message.show('通信错误，请检查网络!', 1500);
				});
				return deferred.promise;
			},

			// 去写评论
			orderDiscuss: function (success, error, orderSn, info) {
				var res = $resource(ENV.API_URL + '?do=order');
				res.save({
					op: 'discuss',
					orderSn: orderSn,
					info: info
				}, success, error);
			},
			// 申请成为分销商
			applyfor: function (success, error, username, mobile) {
				var res = $resource(ENV.API_URL + '?do=agent');
				res.get({op: 'applyfor', username: username, mobile: mobile, type: 'save'}, success, error)
			},
			// 排行榜
			rankingList: function (success, error, type) {
				var res = $resource(ENV.API_URL + '?do=agent');
				res.get({op: 'ranking', type: type}, success, error)
			},
			// 红包专区
			redPage: function (success, error) {
				var res = $resource(ENV.API_URL + '?do=spark');
				res.get({op: 'redPage'}, success, error)
			},
			creditAttron: function (success, error, keys, lev) {
				Message.loading();
				var res = $resource(ENV.API_URL + '?do=credit');
				res.get({op: 'attorn', keys: keys, lev: lev, type: 'keys'}, success, error)
			},
			// 提交余额转让或积分转让金额
			offerAttron: function (success, error, creditInfo, credit, lev) {
				Message.loading();
				var res = $resource(ENV.API_URL + '?do=credit');
				res.get({op: 'attorn', keys: creditInfo.uid, nickname:creditInfo.nickname, credit: credit.money, lev: lev, type: 'set'}, success, error);
			},
			// 余额提现
			toMoney: function (success, error, _t, pasa, user) {
				var res = $resource(ENV.API_URL + '?do=credit');
				var _json = {};
				if(_t == 'get'){
					_json = {
						op: 'shopWithdraw'
					}
				}else if(_t == 'save'){
					_json = {
						op: 'shopWithdraw',
						payType: pasa.payType,
						money: pasa.money,
						name: user.realname,
						code: pasa.code,
						bankName: user.bankName,
						bankNameNo: user.bankNameNo,
						card: user.card,
						alipay: user.alipay,
						teamNum: user.teamNum,
						type:'save'
					}
				}else if(_t == 'code'){
					_json = {
						op: 'shopWithdraw',
						type:'verifycode'
					}
				}
				res.get(_json, success, error);
			},
			// 余额提现记录
			toMoneyList: function(success, error, page){
				Message.loading();
				page = page || 1;
				var res = $resource(ENV.API_URL + '?do=credit');
				res.save({op: 'withdrawList',  page: page}, success, error);
			},
			// 提交提现金额
			huoMoney: function(success, error,  _t, pasa, user){
				var res = $resource(ENV.API_URL + '?do=credit');
				var _json = {};
				if(_t == 'get'){
					_json = {
						op: 'widthdraw'
					}
				}else if(_t == 'save'){
					_json = {
						op: 'widthdraw',
						payType: pasa.payType,
						money: pasa.money,
						name: user.realname,
						bankName: user.bankName,
						bankNameNo: user.bankNameNo,
						card: user.card,
						alipay: user.alipay,
						teamNum: user.teamNum,
						type:'save'
					}
				}
				res.save(_json, success, error);
			},
			// 我的团队里在线留言
			getMessage: function (success, error, keys) {
				var res = $resource(ENV.API_URL + '?do=spark');
				res.get({op: 'redPage', keys: keys}, success, error)
			},
			// 商品返现
			getCashBack: function (success, error, id, pas) {
				var res = $resource(ENV.API_URL + '?do=mc');
				res.get({op: 'cashback', id: id, type: pas}, success, error)
			},
			getMoreBack: function (success, error, page) {
				var res = $resource(ENV.API_URL + '?do=mc');
				page = page || 1;
				res.get({op: 'cashback', page: page}, success, error)
			},
			// 申请代理
			applyAgent: function (info) {
				var resource = $resource(ENV.API_URL + '?do=user');
				var _json = {};
				Message.loading();
				var deferred = $q.defer();
				_json = {
					op: 'joinAgent',
					name: info.realname,
					mobile: info.mobile,
					type: 'send',
				};
				resource.save(_json, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			praise: function (spid) {
				var resource = $resource(ENV.YD_URL + '?do=users');
				var deferred = $q.defer();
				resource.save({op: 'followShops', spid: spid}, function (response) {
					deferred.resolve(response);
				});
				return deferred.promise;
			},
		}
	})

	.factory('Help', function ($resource, ENV, Message, $q) {
		var resorce = $resource(ENV.API_URL + '?do=user', {}, {
			query: {
				method: 'get',
				params: {
					op: '@op',
					id: "@id"
				},
				timeout: 5000
			}
		});

		return {
			getList: function () {
				var _q = $q.defer();
				resorce.query({
					op: 'help'
				}, function (response) {
					/*if (response.code != 0) {
					 Message.show(response.msg);
					 }*/
					_q.resolve(response);
				}, function (error) {
					_q.reject(error);
				});
				return _q.promise;
			},
			getDetail: function (id) {
				var _q = $q.defer();
				resorce.query({
					op: 'help',
					id: id
				}, function (response) {
					if (response.code != 0) {
						Message.show(response.msg);
					}
					_q.resolve(response);
				}, function (error) {
					_q.reject(error);
				});

				return _q.promise;
			}

		}
	})

	.factory('Home', function ($resource, $rootScope, $ionicLoading, ENV,Message, $q) {
		var home = {};
		var moreGoods = [];
		var resource = $resource(ENV.API_URL, {}, {query: {method: 'get', params: {do: 'index'}, timeout: 5000}});
		return {
			getFocusList: function () {
				return home.slides;
			},
			getNavList: function () {
				return home.navInfo;
			},
			content: function () {
				return home.content;
			},
			hotGoods: function () {
				return home.hotGoods;
			},
			content1: function () {
				return home.content1;
			},
			content2: function () {
				return home.content2;
			},
			fetch: function () {    //文章收藏列表  为了方便放在这个服务里面
				// Message.loading();
				return resource.query({
					op: 'dappDisplay'
				}, function (response) {
					Message.hidden();
					home = response.data;
					$rootScope.$broadcast('home.updated');
				}, function () {
					$ionicLoading.hide();
					$ionicLoading.show({
						noBackdrop: true,
						template: '通信错误，请检查网络！',
						duration: '2000'
					});
				});
			},
			getMoreGoods: function () {
				return moreGoods;
			},
			fetchMoreGoods: function (success, error, page) {
				page = page || 1 ;
				var res = $resource(ENV.API_URL + '?do=index');
				res.get({op: 'moregoods', page: page}, success, error)
			},
			getNav: function (id, types) {
				var resource = $resource(ENV.API_URL + '?do=index');
				// Message.loading();
				var deferred = $q.defer();
				resource.get({op: 'getNav', id: id, types: types}, function (response) {
					Message.hidden();
					if(response.code == 0){
						deferred.resolve(response.data);
					}else if(response.code == 1){
						Message.show(response.msg);
					}
				});
				return deferred.promise;
			},
		};
	})

	.factory('Category', function ($resource, $rootScope, $ionicLoading, $state, ENV, Message) {
		var category = {};
		var lists = {};
		var resource = $resource(ENV.API_URL + '?do=category');
		return {
			// getCategory: function () {
			// 	return category;
			// },
			// fetch: function () {     //文章收藏列表  为了方便放在这个服务里面
			// 	return resource.query({
			// 		op: 'display'
			// 	}, function (response) {
			// 		category = response.data;
			// 		$rootScope.$broadcast('category.updated');
			// 	}, function () {
			// 		$ionicLoading.hide();
			// 		$ionicLoading.show({
			// 			noBackdrop: true,
			// 			template: '通信错误，请检查网络！',
			// 			duration: '2000'
			// 		});
			// 	});
			// },
			// getList: function (success, error, condition) {
			// 	resource.get({op: 'list', condition: condition}, success, error);
			// },

			getCategory: function (success, error) {
				// Message.loading();
				resource.get({op: 'display'}, success, error)
			}
		}

	})

	.factory('List', function ($resource, $state, ENV, Message, $q) {
		var resource = $resource(ENV.API_URL + '?do=lists');
		return {
			search: function (type, keywords, spid) {
				if (!keywords || keywords.length < 1) {
					Message.show("请输入一个以上关键词！");
					return false;
				}
				if(type == 'goods'){
					$state.go('mall.list', {type: type, k: keywords, spid: spid});
				}else if(type == 'shops'){
					$state.go('offline.shopList', {keywords: keywords});
				}
			},

			getList: function (success, error, type, keywords, spid, cid) {
				resource.get({op: 'display', type: type, keywords: keywords, spid: spid, cid: cid}, success, error);
			},
			// 搜索类型
			getSearchType: function (success, error, marking, keywords, type, spid, cid, marking_price, page) {
				resource.get(
					{
						op: 'display',
						marking: marking,
						keywords: keywords,
						type: type,
						spid: spid,
						cid: cid,
						marking_price: marking_price,
						page: page
					},
					success, error)
			},
			getSearchHotInfo: function (type) {
				var res = $resource(ENV.API_URL + '?do=api');
				var deferred = $q.defer();
				// Message.loading();
				res.save({op: 'getSearchHotInfo', type: type}, function (response) {
					Message.hidden();
					if (response.code == 0) {
						deferred.resolve(response.data);
					}else if (response.code == 1) {
						Message.show(response.msg);
					}
				});
				return deferred.promise;
			},
		}
	})

	.factory('Cart', function ($resource, $rootScope, $ionicLoading, ENV, User, Message, $state) {
		var checkout = {};
		var resource = $resource(ENV.API_URL + '?do=cart', {}, {
			query: {
				method: 'get',
				params: {
					op: '@op',
					uid: '@uid',
					timestamp: '@timestamp',
					signature: '@signature'
				},
				timeout: 2000
			}
		});
		return {
			getCheckout: function () {
				return checkout;
			},
			fetchCheckoutData: function (success, error, type, goodsInfo) {
				userInfo = User.getCurrentUser();
				var _json = {
					op: 'checkout',
					type: type,
					goodsInfo: goodsInfo,
					uid: userInfo.uid,
				};
				resource.save(_json, success, error);
			},
			/*购物车页面*/
			getCartInfo: function (success, error) {
				// Message.loading();
				var _json = {
					'op': 'getCartList'
				};
				resource.save(_json, success, error);
			},
			/*购物车操作页面*/
			getNewCartInfo: function (success, error, para) {
				var _json = {
					'op': 'update',
					cartId: para.cartId
				};

				if (para.type == "check") {
					_json = {
						'op': 'check',
						cartIds: para.arr
					};
				} else if (para.type == 1) { //1为加减 2为删除
					_json.num = para.num;
				} else {
					_json.num = 0;
				}

				resource.save(_json, success, error);
			}
		}
	})

	.factory('NameBankAlipy', function ($resource, $rootScope, ENV) {
		return {

			/*获取姓名支付宝银行卡*/
			getNBA: function (success, error) {
				var res = $resource(ENV.API_URL + '?do=user');
				res.save({op:'getUserInfo'}, success, error);
			},
			//获取实名信息
			getrealname:function(success,error){
				var res = $resource(ENV.API_URL + '?do=user');
				var _json = {
					op:'getUserInfo'
				};
				res.save(_json, success, error);
			},
			//实名认证
			setrealname:function(success,error,para){
				var res = $resource(ENV.API_URL + '?do=user');
				var _json = {
					op:'saveName',
					name:para.name,
					idcard:para.idcard
				}
				res.save(_json, success, error);
			},

			/*修改真实姓名*/
			updataAccount: function (success, error, para, type) {
				var res = $resource(ENV.API_URL + '?do=user');
				var _json = {};
				switch (type) {
					case 1:
						_json = {
							op: 'saveName',
							name: para.name,
							idcard: para.idcard,
							idcardA: para.idcardA,
							idcardB: para.idcardB
						};
						res.save(_json, success, error);
						break;
					case 2:
						_json = {
							op: 'saveAlipay',
							alipay: para
						};
						res.save(_json, success, error);
						break;
					case 3:
						_json = {
							op: 'saveCard',
							bankName: para.bankName,
							card: para.card
						};
						res.save(_json, success, error);
						break;
				}
			}
		}
	})

	.factory('Payment', function ($resource, $rootScope, $ionicLoading, ENV, Message, $timeout, $state, $q) {
		var payType = {};
		var resource = $resource(ENV.API_URL + '?do=payment');
		return {
			// 微信支付
			wechatPay: function (info) {
				Wechat.isInstalled(function () {

				}, function (reason) {
					Message.show('使用微信支付，请先安装微信', 2000);
				});
				Message.loading("正在打开微信支付！");
				var _json = {};
				_json = {
					op: 'getWechatDapp', /*, uid: userInfo.uid, signature: sign.signature, timestamp: sign.timestamp*/
					orderId: info
				}
				resource.get(_json, function (response) {
					Message.hidden();
					if(response.code == 0){
						wechatParams = response.data;
						Wechat.sendPaymentRequest(wechatParams, function () {
							Message.show("支付成功");
							$timeout(function () {
								$state.go('mall.paySuccess');
							}, 1300);
							$rootScope.$broadcast('payTypeWechat.updated');
						}, function (reason) {
							console.log("支付失败: " + reason);
						});
					}else if(response.code == 1){
						Message.show(response.msg);
					}
				}, function () {
					Message.show("通信超时，请重试！");
				});
			},
			// 支付宝支付
			alipay: function (info) {
				var _json = {};
				_json = {
					op: 'getAlipayDapp', /*, uid: userInfo.uid, signature: sign.signature, timestamp: sign.timestamp*/
					orderId: info
				}
				resource.get(_json, function (response) {
					if(response.code == 0){
						checkout = response.data;
						window.alipay.pay(checkout, function(successResults){
							Message.show('支付成功', 1200);
							$timeout(function () {
								$state.go('mall.paySuccess');
							}, 1300);
						}, function(errorResults){
							console.error('支付失败：'+ errorResults);
						});
					}else if(response.code == 1){
						Message.show(response.msg);
					}
				},function () {
					Message.show("通信超时，请重试！");
				})

			},
			// 余额支付
			creditPay: function (success, error, info, psw) {
				console.log(info);
				var _json = {};
				_json = {
					op: 'getCreditDapp', /*, uid: userInfo.uid, signature: sign.signature, timestamp: sign.timestamp*/
					orderId: info,
					password:psw
				}
				resource.get( _json, success, error)
			},
			creditShopPay: function (success, error, para) {
				resource.get({
					op: 'getCreditDapp', /*, uid: userInfo.uid, signature: sign.signature, timestamp: sign.timestamp*/
					model:'oto',
					money: para.money,
					spid: para.spid
				}, success, error)
			},
			//环迅支付
			hxpay: function (orderId) {
				var deferred = $q.defer();
				Message.loading();
				resource.save({op: 'hxpay_h5',orderId:orderId}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			getDapp: function (spid) {
				var deferred = $q.defer();
				// Message.loading();
				var _json = {};
				_json={
					op: 'getDapp',
					spid: spid,
					model: 'oto'
				};
				resource.save(_json, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			getOrderInfo: function (pasa, goodsInfo, note) {
				var deferred = $q.defer();
				Message.loading();
				var _json = {};
				if(pasa == 'get'){
					_json={
						op: 'getOrderInfo',
						orderId: goodsInfo
					}
				}else if(pasa == 'save'){
					_json={
						op: 'getOrderInfo',
						goodsInfo: goodsInfo,
						note: note
					}
				}else if(pasa == 'offline'){
					_json={
						op: 'getOrderInfo',
						money: goodsInfo,
						spid: note,
						model: 'oto'
					}
				}
				resource.save(_json, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
		}
	})

	.factory('Goods', function ($resource, $rootScope, $ionicLoading, ENV, Message, $state) {

		var goods = {};
		var bis = [];
		var resource = $resource(ENV.API_URL, {}, {query: {method: 'get', params: {do: 'goods'}, timeout: 5000}});
		return {
			getGoods: function () {
				return goods;
			},

			fetch: function (goodsId) {
				// Message.loading();
				return resource.query({
					op: 'detail',
					id: goodsId
				}, function (response) {
					// Message.hidden();
					if (response.code == 1) {
						Message.show(response.msg);
					} else {
						goods = response.data;
						bis = goods.bis;
						$rootScope.$broadcast('goods.updated');
					}

				}, function () {
					$ionicLoading.hide();
				});
			},

			initAttrSelect: function (firstItem) {
				if (angular.isUndefined(firstItem)) {
					firstItem = goods.attrList;
				}
			},
			// 收藏店铺与商品
			shoucangShop: function (success, error, pas, type) {
				var resource = $resource(ENV.API_URL + '?do=goods');
				var _json = {};
				if (type == 'spid') {
					_json = {
						op: 'shopFollow',
						spid: pas
					}
				} else if (type == 'id') {
					_json = {
						op: 'goodsLike',
						id: pas
					}
				}
				resource.save(_json, success, error)
			},
			/*获取商品规格*/
			getGoodsOp: function (success, error, para) {
				var resource = $resource(ENV.API_URL + '?do=goods');
				var _json = {
					op: 'attrInfo',
					attrId: para.attrid,
					id: para.id
				};
				resource.get(_json, success, error);
			}

		}
	})

	.factory('Order', function (Message, ENV, Storage, $rootScope, $resource) {
		var res = $resource(ENV.API_URL + '?do=order');

		return {
			// 退货
			returnGoodsInfo: function (success, error, orderSn) {
				Message.loading();
				res.get({op: 'returnGoodsInfo', orderSn: orderSn}, success, error)
			},
			getDetail: function (orderSn, success, error) {
				Message.loading();
				var _json = {'op': 'detail', orderSn: orderSn};
				res.save(_json, success, error);
			},
			evaluate: function (orderSn, data, success, error) {
				Message.loading();
				var _json = {'op': 'discuss', orderSn: orderSn, data: data};
				res.save(_json, success, error);
			}
		}
	})

	.factory('Mc', function (Message, ENV, Storage, $rootScope, $resource) {
		var res = $resource(ENV.API_URL + '?do=mc');

		return {
			//浏览记录
			getfoot:function(success,error,page){
				// Message.loading();
				var _json = {'op': 'goodsClick',page:page};
				res.save(_json, success, error)
			},
			//获取收藏列表
			getColl : function(type,success,error,page){
				// Message.loading();
				var _json = {'op': type,page:page};
				res.save(_json, success, error)
			},
			/*获取个人中心的数据*/
			getUserInfo: function (success, error) {
				// Message.loading();
				var _json = {'op': 'display'};
				res.save(_json, success, error)
			},

			/*获取地址列表*/
			getUserAddress: function (success, error) {
				Message.loading();
				var _json = {'op': 'addressList'};
				res.save(_json, success, error);
			},

			/*删除地址列表*/
			removeUserAddress: function (success, error, id) {
				Message.loading();
				var _json = {'op': 'delAddress', 'id': id};
				res.save(_json, success, error);
			},

			/*添加默认地址列表*/
			addAddress: function (success, error, para, type, id) {
				var _json = {
					op: 'addAddress',
					type: 'save',
					username: para.name,
					sex:para.sex,
					mobile: para.mobile,
					birth: para.area,
					address: para.infoAddress
				};

				if (type) {
					_json = {
						op: 'addAddress',
						type: 'save',
						username: para.name,
						sex:para.sex,
						mobile: para.mobile,
						birth: para.area,
						address: para.infoAddress,
						id: id
					};
				}
				res.save(_json, success, error);
			},

			/*修改成默认地址*/
			defaultAddress: function (success, error, para) {
				var _json = {
					op: 'updateAddress',
					id: para
				};
				res.save(_json, success, error);
			},

			// 判断是否为分销商
			isApplyfor: function (success, error, _t, pasa) {
				Message.loading();
				var _json = {};
				if(_t == 'get'){
					_json = {
						op: 'applyfor'
					}
				}else if(_t == 'save'){
					_json = {
						op: 'applyfor',
						username: pasa.name,
						mobile: pasa.mobile,
						type: 'save'
					}
				}
				var res = $resource(ENV.API_URL + '?do=agent');
				res.get(_json, success, error)
			},
			// 卡密
			getCami: function (success, error) {
				var res = $resource(ENV.API_URL + '?do=cami');
				res.get({op: 'display'}, success, error)
			},

		}
	})

	//读取系统后台配置
	.factory('Config', function ($resource, ENV) {

		var resource = $resource(ENV.API_URL + '?do=user');
		return {
			fetchAboutUs: function (success, error) {
				resource.get({op: 'config', type: 'aboutUs'}, success, error);
			},
			fetchVersion: function (success, error) {
				resource.get({op: 'config', type: 'version'}, success, error);
			}
		}
	})

	.factory('Jpush', function (Storage, $state) {
		return {
			init: function () {
				try {
					window.plugins.jPushPlugin.init();
				} catch (exception) {
					// console.info(exception);
				}
				document.addEventListener("jpush.setTagsWithAlias", this.onTagsWithAlias, false); //设置别名与标签
				document.addEventListener("jpush.openNotification", this.onOpenNotification, false); //点击通知进入应用程序时会出发改事件
			},
			getRegistrationID: function () {
				window.plugins.jPushPlugin.getRegistrationID(function (data) {
					var JPushData = {registerId: data};
					try {
						console.info(JPushData);
						Storage.set('JPush', JPushData);
					} catch (exception) {
						console.info(exception);
					}
				});
			},
			setTagsWithAlias: function (tags, alias) {
				try {
					window.plugins.jPushPlugin.setTagsWithAlias(tags, alias);
				} catch (exception) {
					console.info(exception);
				}
			},
			onTagsWithAlias: function (event) {
				try {
					console.info(event);
				} catch (exception) {
					console.info(exception);
				}
			},
			onOpenNotification: function (event) {
				try {
					if (device.platform == "Android") {
						var extras = event.extras;
						if (extras.type == 'shopOrderNotice') {
							console.info('shopOrderNotice', extras);
							$state.go('shop.OrderDetails', {id: extras.orderId});
						}
					} else {
						alertContent = event.aps.alert;
					}
				} catch (exception) {
					console.info("JPushPlugin:onOpenNotification" + exception);
				}
			}
		}
	})

	.factory('System', function ($http, $timeout, $q, $ionicLoading, $ionicPopup, $cordovaInAppBrowser, $resource, $rootScope,$cordovaAppVersion, Message, ENV) {
		var verInfo;
		var resource = $resource(ENV.API_URL, {do: 'update'});
		return {
			aboutUs: function(success, error){
				Message.loading();
				resource.get({op:'checkVersion'}, success, error);
			},
			checkUpdate: function () {
				var deferred = $q.defer();
				resource.get({op: "checkVersion"}, function (response) {
					if(response.code != 0){
						Message.show('检查更新失败，请稍后重试！');
					}
					var newVerInfo = response.data;//服务器 版本
					try{
						$cordovaAppVersion.getVersionNumber().then(function (curVersion) {
							if (curVersion < newVerInfo[$rootScope.platform]) {
								$ionicPopup.confirm({
									template: '发现新版本，是否更新版本',
									buttons: [{
										text: '取消',
										type: 'button-default'
									}, {
										text: '更新',
										type: 'button-positive',
										onTap: function () {
											$cordovaInAppBrowser.open(newVerInfo[$rootScope.downloadUrl], '_system');
										}
									}]
								});
							} else {
								deferred.resolve();
							}
						}, function () {
							Message.show('通讯失败，请检查网络！');
						});
					}catch (e){
						console.info(e);
						Message.show('检查更新失败，请稍后重试！');
					}
				}, false);
				return deferred.promise;
			}
		}
	})

	.factory('Message', function ($ionicLoading) {
		return {
			show: function () {
				var text = arguments[0] ? arguments[0] : 'Hi，出现了一些错误，请检查网络或者退出重试！';
				var duration = arguments[1] ? arguments[1] : 1200;
				var callback = arguments[2] ? arguments[2] : '';
				$ionicLoading.hide();
				if (typeof callback === "function") {
					$ionicLoading.show({
						noBackdrop: true,
						template: text,
						duration: duration
					}).then(function () {
						callback();
					});
				} else {
					$ionicLoading.show({
						noBackdrop: true,
						template: text,
						duration: duration
					});
				}
			},
			loading: function () {
				var text = arguments[0] ? arguments[0] : '';
				$ionicLoading.hide();
				$ionicLoading.show({
					hideOnStateChange: false,
					duration: 10000,
					template: '<ion-spinner icon="spiral" class="spinner-stable"></ion-spinner><br/>' + text
				})
			},
			hidden: function () {
				$ionicLoading.hide();
			}
		};
	})

	.factory('TokenAuth', function ($q, Storage, $location) {
		return {
			request: function (config) {
				var userInfo = Storage.get('user');
				config.headers = config.headers || {};
				if (userInfo && userInfo.token) {
					config.headers.TOKEN = userInfo.token;
				}
				return config;
			},
			response: function (response) {
				if (response.data.code === 403) {
					Storage.remove('user');
					$location.path('/auth/login');
				}
				return response || $q.when(response);
			}
		};
	})

	.factory("Shop", function (Message, ENV, Storage, $rootScope, $resource, $q) {
		var resource = $resource(ENV.API_URL + '?do=shops');
		var res = $resource(ENV.YD_URL, {do: 'shops'});
		return {

			//申请成为商家
			applyfor:function(success, error,data,type){
				Message.loading();
				var _json;
				if(type == 'save'){
					_json = {
						op:'applyfor',
						type:'save',
						username : data.username,
						mobile : data.mobile,
						description : data.description,
						shopPerUid: data.shopPerUid,
						idCardThumbA : data.idCardThumbA,
						idCardThumbB  : data.idCardThumbB,
						businessLicence : data.businessLicence,
						accordingToTheDoor : data.accordingToTheDoor,
						birth : data.birth,
						shopName : data.shoptitle,
						cid : 'bbc',
						address : data.address,
						shopType : data.cid ,
						shopTime : data.shopTime,
						content : data.content
					};
				}else if(type == 'select'){
					_json = {
						op:'applyfor',
						type:'select',
						shopType:data
					}
				}else if(!type){
					_json = {
						op:'applyfor'
					}
				}

				resource.save(_json, success, error);
			},
			getShop: function (success, error, spid, isCare) {
				resource.save({op: 'display', spid: spid, isCare: isCare}, success, error);
			},
			nearbyShop: function (success, error, spid, page) {
				// Message.loading();
				page  = page || 1;
				resource.save({op: 'nearbyShop', spid: spid, page: page}, success, error);
			},
			// 商品简介
			shopsDesc: function (success, error, spid) {
				// Message.loading();
				resource.save({op: 'shopsDesc', spid: spid}, success, error);
			},
			// 在线支付
			payonLine: function (success, error, spid) {
				res.save({op: 'getShopsInfo', spid: spid}, success, error)
			},
			// 商家提现列表
			shopWithdrawList: function(success, error, page){
				var res = $resource(ENV.API_URL + '?do=shopadmin');
				page = page || 1;
				res.save({op: 'withdrawList', page: page}, success, error);
			},
			// 商户提现中心
			shopWithdraw: function(success, error, _t, pas){
				var res = $resource(ENV.API_URL + '?do=shopadmin');
				var _json = {};
				if(_t == 'get'){
					_json = {
						op: 'withdraw'
					}
				}else{
					_json = {
						op: 'withdraw',
						cname: pas.cname,
						mobile: pas.mobile,
						uname: pas.uname,
						username: pas.username,
						price: pas.price,
						withType: pas.withType,
						cardType: pas.cardType,
						cardInfo: pas.cardInfo,
						password: pas.password,
						type: 'save'
					}
				}
				res.save(_json, success, error);
			},
			// 资金信息
			shopOrderInfo: function(success, error){
				var res = $resource(ENV.API_URL + '?do=shopadmin');
				res.save({op: 'orderPay'}, success, error);
			},
			// 商户订单信息
			shopOrderList: function(success, error, page, pas){
				var res = $resource(ENV.API_URL + '?do=shopadmin');
				page = page || 1;
				res.save(
					{
						op: 'shopadmin',
						page: page,
						type: pas
					}, success, error);
			},

			// 搜素订单
			searchOrderList: function (success, error, num) {
				var res = $resource(ENV.API_URL + '?do=shopadmin');
				res.save(
					{
						op: 'shopadmin',
						orderId: num,
						type: 'save'
					}, success, error);
			},
			// 订单详情
			shopOrderDetail: function (success, error, id, spid) {
				var res = $resource(ENV.API_URL + '?do=shopadmin');
				res.save({op: 'details', id: id, spid: spid}, success, error);
			},

			shopOrderConfirm: function (success, error,  id, spid, confiNum) {
				var res = $resource(ENV.API_URL + '?do=shopadmin');
				res.save({op: 'details',id: id, spid: spid, bdelete: confiNum, type: 'save'}, success, error)
			},
			getShopModel: function (success, error, spid) {
				var res = $resource(ENV.API_URL + '?do=api');
				res.save({op: 'getShopModel',spid: spid}, success, error)
			},
			//获取商家二维码
			getshopQrcode:function(success,error,spid){
				var res = $resource(ENV.API_URL + '?do=api');
				res.save({op:'display',spid:spid},success,error)
			},
			//获取商家二维码
			getshopInfo:function(success,error,spid){
				resource.save({op:'payLine',spid:spid},success,error)
			},
			// underList: function (success,error,page) {
			// 	var res = $resource(ENV.API_URL + '?do=user');
			// 	//Message.loading();
			// 	page = page || 1;
			// 	res.save({op: 'creditInfo', page: page},success,error);
			// 	// return deferred.promise;
			// },
			// 线下商家
			getShopsDetail: function (spid) {
				Message.loading();
				var deferred = $q.defer();
				res.save({op: 'shopsInfo', spid: spid}, function (response) {
					deferred.resolve(response);
				});
				return deferred.promise;
			},
		}
	})

	.factory("Area", function ($resource, Message) {
		var resource = $resource("lib/area.json");
		return {
			getList: function (success, pid, cid) {
				resource.get({}, function (data) {
					success(data);
				});
			}
		}
	})

	.factory('Lbs', function (ENV, $resource) {
		var resource = $resource(ENV.API_URL, {do: 'api'});
		/**
		 * @return {number}
		 */
		var Rad = function (d) {
			return d * Math.PI / 180.0;//经纬度转换成三角函数中度分表形式。
		};
		return {
			calcDistance: function (p1, p2) {
				var radLat1 = Rad(p1.lat);
				var radLat2 = Rad(p2.lat);
				var a = radLat1 - radLat2;
				var b = Rad(p1.lng) - Rad(p2.lng);
				var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
				s = s * 6378.137;
				s = Math.round(s * 10000) / 10000; //输出为公里
				s = s.toFixed(2);
				return s;
			},
			getCity: function (success, error, posi) {
				return resource.get({op: 'getPlace', lat: posi.lat, lng: posi.lng}, success, error);
			},
			getLatlng: function (success, error, keyword) {
				return resource.save({op: 'getLatlng', keyword: keyword}, success, error);
			}
		};
	})

	.factory('Oto', function ($resource, $rootScope, $ionicLoading, ENV, Message, $q) {
		var home = {};
		var moreGoods = [];
		var goodsTui = [];
		var goodsHot = [];
		var resource = $resource(ENV.YD_URL, {}, {query: {method: 'get', params: {do: 'home'}, timeout: 5000}});
		return {
			getFocusList: function () {
				return home.slide;
			},
			getNavList: function () {
				return home.navInfo;
			},
			getCustom: function () {
				return home.custom;
			},
			noticeInfo: function(){
				return home.info;
			},

			fetch: function () {    //文章收藏列表  为了方便放在这个服务里面
				// Message.loading();
				return resource.query({
					op: 'display'
				}, function (response) {
					Message.hidden();
					home = response.data;
					$rootScope.$broadcast('home.updated');
				}, function () {
					$ionicLoading.hide();
					$ionicLoading.show({
						noBackdrop: true,
						template: '通信错误，请检查网络！',
						duration: '2000'
					});
				});
			},
			getMoreGoods: function () {
				return moreGoods;
			},

			getAddressList: function (success, error, keywords){
				var resource = $resource(ENV.API_URL + '?do=api');
				resource.get({op: 'getPosi', keywords: keywords}, success, error)
			},
			getSearchCity: function (success, error, lat, lng, keywords, page) {
				var resource = $resource(ENV.YD_URL + '?do=home');
				page = page || 1;
				// Message.loading();
				resource.get({op: 'shopsList', lat: lat, lng: lng, keywords: keywords, page: page}, success, error)
			},
			getPlace: function (success, error, lat, lng) {
				var resource = $resource(ENV.API_URL + '?do=api');
				resource.get({op: 'getPlace', lat: lat, lng: lng}, success, error)
			},
			getSelectCity: function (keyword) {
				var resource = $resource(ENV.API_URL + '?do=api');
				Message.loading();
				var deferred = $q.defer();
				resource.get({op: 'getLatlng', keyword: keyword}, function (response) {
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			shopsList: function (cid,keywords, page) {
				var resource = $resource(ENV.API_URL + '?do=lists');
				// Message.loading();
				page = page || 1;
				var deferred = $q.defer();
				resource.get({op: 'display',cid: cid,keywords: keywords, page: page, model: 'oto', type:'shops'}, function (response) {
					// Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			// 线下商家列表
			offlineShopsList: function (cid, keywords, page) {
				var resource = $resource(ENV.YD_URL, {do: 'home'});
				page = page || 1;
				var deferred = $q.defer();
				Message.loading();
				resource.get({op: 'shopsList', cid: cid, keywords: keywords, page: page}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			userOtoOrder: function (page) {
				var resource = $resource(ENV.API_URL + '?do=order');
				Message.loading();
				var deferred = $q.defer();
				resource.get({op: 'otoOrder', page: page}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			userOtoOrderDetail: function (id) {
				var resource = $resource(ENV.API_URL + '?do=order');
				Message.loading();
				var deferred = $q.defer();
				resource.get({op: 'otoDetail', id: id}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			shopOtoOrder: function (page) {
				var resource = $resource(ENV.API_URL + '?do=shopadmin');
				Message.loading();
				var deferred = $q.defer();
				resource.get({op: 'otoOrder', page: page}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			shopOtoOrderDetail: function (id) {
				var resource = $resource(ENV.API_URL + '?do=shopadmin');
				Message.loading();
				var deferred = $q.defer();
				resource.get({op: 'otoDetail', id: id}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			getNav: function (id, types) {
				var resource = $resource(ENV.YD_URL + '?do=home');
				// Message.loading();
				var deferred = $q.defer();
				resource.get({op: 'getNav', id: id, types: types}, function (response) {
					Message.hidden();
					if(response.code == 0){
						deferred.resolve(response.data);
					}else if(response.code == 1){
						Message.show(response.msg);
					}
				});
				return deferred.promise;
			},
		};
	})

	.factory('Article', function ($resource, $rootScope, $ionicLoading, ENV, Message, $state, $q) {
		var resource = $resource(ENV.API_URL, {do: 'article'});
		return {
			list: function (page) {
				var deferred = $q.defer();
				page = page || 1;
				// Message.loading();
				resource.get({op: 'list', page: page}, function (response) {
					// Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			detail: function (id) {
				var deferred = $q.defer();
				Message.loading();
				resource.get({op: 'info', id: id}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
		}
	})

	.factory('Credit', function ($resource, $rootScope, $ionicLoading, ENV, Message, $state, $q, $timeout) {
		var resource = $resource(ENV.API_URL, {do: 'user'});
		return {
			getCredit: function (_t, type, page) {
				var deferred = $q.defer();
				page = page || 1;
				Message.loading();
				var _json = {};
				if (_t == 'balance') {
					_json = {
						op: 'withdrawList',
						type: type,
						page: page
					}
				} else if (_t == 'red') {
					_json = {
						op: 'joinOrder',
						page: page
					}
				} else if (_t == 'point') {
					_json = {
						op: 'dedList',
						type: type,
						page: page
					}
				}
				resource.get(_json, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			getAttorn: function (pasa, giveInfo) {
				var deferred = $q.defer();
				Message.loading();
				var _json = {};
				if(pasa == 'get'){
					_json = {
						op: 'underConsume',
					}
				}else if(pasa == 'save'){
					_json = {
						op: 'underConsume',
						mobile: giveInfo.mobile,
						num: giveInfo.giveNum,
						type: 'check'
					}
				}else if(pasa == 'code'){
					_json = {
						op: 'underConsume',
						type: 'verifycode'
					}
				}
				resource.get(_json, function (response) {
					Message.hidden();
					if(response.code == 0){
						deferred.resolve(response.data);
						if(pasa != 'get'){
							$timeout(function () {
								Message.show(response.msg)
							}, 1000);
							if(pasa == 'save'){
								$state.go('shop.offOrderList')
							}
						}

					}else if(response.code == 1){
						Message.show(response.msg)
					}
				});
				return deferred.promise;
			},
			getUser: function (uid) {
				var deferred = $q.defer();
				Message.loading();
				resource.get({op: 'attorn', keys: uid, type: 'keys'}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			cityRebate: function (page, _t, uid) {
				var deferred = $q.defer();
				Message.loading();
				page = page ||1;
				var _json = {};
				if(_t == 'search'){
					_json = {
						op: 'cityRebate',
						uid: uid,
						type: '1'
					}
				}else{
					_json = {
						op: 'cityRebate',
						page: page
					}
				}
				resource.get(_json, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			cityPartner: function (page) {
				var deferred = $q.defer();
				Message.loading();
				page = page ||1;
				resource.get({op: 'cityPartner', page: page}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
			// 我的余额充值 
			getRecharge: function (money,payType) {
				var deferred = $q.defer();
				var res = $resource(ENV.API_URL + '?do=credit');
				Message.loading();
				res.save({op: 'recharge', money: money,payType: payType}, function (response) {
					Message.hidden();
					deferred.resolve(response);
				});
				return deferred.promise;
			},
		}
	})
	
	.factory('T', ['$translate', function($translate) {
	    var T = {
	        T:function(key) {
	            if(key){
	                return $translate.instant(key);
	            }
	            return key;
	        }
	    }
	    return T;
	}]);

