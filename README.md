##一款中英双语的商城app（angular+ionic）
搭建ionic环境
clone项目到本地
运行 ionic server
打包 ionic build

##插件安装：
1. 请重置最新版本的package.json<br/>
```
svn revert package.json
```
2. 如果安装有android平台，否则忽略<br/>
```
ionic platform remove android
```
3. 添加android平台<br/>
```
ionic platform add android
```
##手工安装方法<br/>
微信支付插件
```
ionic plugin add cordova-plugin-wechat --variable wechatappid=
```
<i>极光推送插件</i>
```
ionic plugin add https://github.com/jpush/jpush-phonegap-plugin.git --variable API_KEY= 
```
支付宝支付插件
```
ionic plugin add https://github.com/charleyw/cordova-plugin-alipay.git --variable PARTNER_ID= --variable SELLER_ACCOUNT= --variable PRIVATE_KEY=
```
百度地位
```
ionic plugin add https://github.com/liangzhenghui/cordova-qdc-baidu-location#1.0.0 --variable API_KEY=''

```