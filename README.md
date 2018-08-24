【*内部资料请勿泄露】
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
ionic plugin add cordova-plugin-wechat --variable wechatappid=wxd1b7c454dfc2f5c5
```
<i>极光推送插件</i>
```
ionic plugin add https://github.com/jpush/jpush-phonegap-plugin.git --variable API_KEY=1fcd1c10e49ec5e3450fe49a  
```
支付宝支付插件
```
ionic plugin add https://github.com/charleyw/cordova-plugin-alipay.git --variable PARTNER_ID=2088221852825223 --variable SELLER_ACCOUNT=zjdd97zzh@126.com --variable PRIVATE_KEY=MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBALDbzmvHosDGVnYxZYfH4VweaD5vxgvDI8bVOTJmRCDfSiawLS/jjM8HxyrNgTDzVeWOvZ3/zblGK4MTJcE+EU+GSgI4KcD8PVJZ/mYDQWJi1iOpWAJVVQX/Z/N5tmNoKWknq8FPNHa0qfEDZagwKAfbU9dB9jquyS3pvQB7FG6pAgMBAAECgYACRxJlePCzotpCM2inUv+n/AxDoZTfWegAC4btCzwdYELINMSgNUH++I6sEnFze+7DQg9XFZBEro6o5Xo6/t2iLxCvUK71RgAIOvXdFU9+/dVlvCo+4IZSrADP3HLSg/Rhd5gzcfmsW0V5WHuVklTMOA4DTvkqQ57ZTGQN69lSMQJBANxF+mWVtLyL0wTi27LbaWctOqfPi3ePlnwfSEn2QyzXjRjP348PbBdRquaEDAmhovI8h8rLCjLMoWok/SLVwaMCQQDNizHfPBlN20kKdoW2IyavGxai52PTs3rwon3px7hC7ydJzZ0luFpnZ9v2/ORdneLVAHOQgPTLuYpNcHyzeEtDAkEAuK0q7DSBnXqVZwlULTZrvodbIAqP4aPPBS2tC+WeGGB3+Y9+3ZCOjVZ5NF8NQJ314aYCK3HjkQejZTyxxpz0hQJAYmBXy1eRaOEmkVpu3uDuF+soJ2oGLoH9uoSbLTRI7chXDozZxP76Tfm4nvslNeVmdroTlbsS7xrrperL1H4jzwJBAKsq5mrMssA1VyUyi4TX+UV6/exixe0KuKijGySMjApWKUd755nL1aIjNDGVbXhYc4/4ZRJDr8KNuNTumrcoudI=
```
百度地位
```
ionic plugin add https://github.com/liangzhenghui/cordova-qdc-baidu-location#1.0.0 --variable API_KEY='FlsoOx129dy1F1RhL24vyFLr8uMuGffP'

```