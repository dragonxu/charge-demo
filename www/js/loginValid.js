function getCookie(name){
	var reg = new RegExp("(^| )"+name+"=([^;]*)(;|$)");
	return cookie = document.cookie.match(reg)?unescape(document.cookie.match(reg)[2]):null;
}

//登录验证
if(!getCookie('sx_userInfo')){
	var backUrl = encodeURIComponent(window.location.href.replace(window.location.search,''));//编码跳转链接
	window.location.href = 'login.html?burl='+ backUrl ;//跳转
}


