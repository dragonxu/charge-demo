// JavaScript Document
var gs = {}//创建公共方法和函数 
var mainUrl = 'http://115.159.107.59:8090/cgi-bin/chargeclound_web/';
gs.cgi = {
	web_user_register: mainUrl + 'web_user_register',//注册
	web_user_del: mainUrl + 'web_user_del',//删除
	web_user_login1: mainUrl + 'web_user_login1',//注册成功后 登录
	web_user_login2: mainUrl + 'web_user_login2',//正常登录

	web_overview : mainUrl + 'web_overview',	//获取总览信息
	web_get_station_info : mainUrl + 'web_get_station_info',	//获取充电网络表格数据
	web_get_city_list : mainUrl +'web_get_city_list',//获取用户所有充电站信息
	web_dev_real_data : mainUrl + 'web_dev_real_data',	//获取充电桩详情
	web_start_charge: mainUrl + 'web_start_charge',//启动充电
	web_stop_charge: mainUrl + 'web_stop_charge',//停止充电
	web_dev_ctrl_record: mainUrl + 'web_dev_ctrl_record',//获取控制记录数据
	web_dev_real_alarm: mainUrl + 'web_dev_real_alarm',//获取实时告警数据
	web_dev_his_alarm: mainUrl + 'web_dev_his_alarm',//获取历史告警数据
	web_dev_charge_record: mainUrl + 'web_dev_charge_record',//充电记录
	web_fee_detail: mainUrl + 'web_fee_detail',//费用管理
	web_dev_query: mainUrl + 'web_dev_query',//查询充电站
	web_user_query: mainUrl + 'web_user_query',//查看用户权限
	
	web_station_oper: mainUrl +'web_station_oper',//新增充电站 删除 更改
	web_get_pile_list: mainUrl + 'web_get_pile_list',//根据充电站ID获取电桩列表
	web_pile_oper: mainUrl +'web_pile_oper',//新增电桩 删除 更改

	web_score_query: mainUrl+ 'web_score_query',
	web_analysis: mainUrl +'web_analysis',//充电分析
	web_service_fee_query: mainUrl + 'web_service_fee_query',
	web_get_station_list: mainUrl+ 'web_get_station_list',
	web_service_fee_oper: mainUrl + 'web_service_fee_oper',
	web_user_repass: mainUrl + 'web_user_repass',//更改密码
	web_get_pile_real_data: mainUrl + 'web_get_pile_real_data',//获取充电网络电桩的实时数据
	pro:''
}
layer.config({
	title:'系统信息',
	offset:'20px'
});
var gs_pile_state = {
	100:{text:'空闲',dec:'该电桩未被占用，电桩104帧上报空闲中状态'}
	,101:{text:'收到预约',dec:'app已经下发预约充电指令，后台也将该指令下发给电桩'}
	,102:{text:'预约中',dec:'电桩104帧上报已被预约状态'}
	,103:{text:'预约失败',dec:'电桩返回预约失败状态'}
	,104:{text:'开始充电',dec:'app下发开始充电指令，后台也将该指令下发给电桩'}
	,105:{text:'准备充电',dec:'电桩104帧上报准备开始充电状态'}
	,106:{text:'充电中',dec:'电桩104帧上报充电中状态'}
	,107:{text:'开始失败',dec:'电桩104帧上报启动失败状态'}
	,108:{text:'停止充电',dec:'app下发停止充电命令，后台也将该指令下发给电桩'}
	,109:{text:'停止失败',dec:'预留'}
	,110:{text:'后台故障',dec:'因为后台core，通信中断等原因造成电桩不可用'}
	,111:{text:'电桩故障',dec:'预留'}
	,112:{text:'电桩被占用',dec:'电桩被占用，不可充电'}
	,113:{text:'取消预约',dec:'取消预约充电命令发送后，会切换到该状态'}
	,114:{text:'通信故障',dec:'通信故障'}
}
gs.func = {
	callCgi:function(url,param,callback){
		var load_index = layer.load(0,{offset:'auto'});
		$.ajax({
			url:url,
			async:true,
			type:'POST',
			data:param,
			dataType:'json',
			success:function(json){
				layer.close(load_index);
				if(typeof(json) != 'object'){
					json = $.parseJSON(json);
				}
				if(json.ret == 0){
					if(callback){
						callback(json);	
					}
				}else if(json.ret == -100){//登录异常
					window.location.href = 'login.html?burl='+encodeURIComponent(window.location.href);//直接跳转
				}else if(json.ret == -101){//无权限 不显示值即可
					//待处理
					layer.alert(json.ret_msg,function(index){
						layer.close(index);
					});
				}else{
					layer.alert(json.ret_msg,function(index){
						layer.close(index);
					});
				}
				
				
			},
			error: function(XMLHttpRequest, textStatus, errorThrown){
				//console.log(3);
				//console.log(XMLHttpRequest.status);
				if(XMLHttpRequest.status == '500'){
					//alert(errorThrown);
					window.location.href = '500.html';	
				}else if(XMLHttpRequest.status == '404'){
					window.location.href = '404.html';		
				}
				//console.log(textStatus);
				//console.log(errorThrown);
			},
		});
	},
	callCgi1:function(url,param,callback){//注册 登录专用
		$.ajax({
			url:url,
			async:true,//异步 一个一个响应
			type:'post',
			data:param,
			dataType:'json',
			success:function(json){
				if(typeof(json) != 'object'){
					json = $.parseJSON(json);
				}
				if(json.ret == 0){
					if(callback){
						callback(json);	
					}
				}else{
					layer.msg(json.ret_msg,{icon: 5,offset:'30px'});
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown){
				//console.log(3);
				//console.log(XMLHttpRequest.status);
				if(XMLHttpRequest.status == '500'){
					//alert(errorThrown);
					//window.location.href = '500.html';	
				}else if(XMLHttpRequest.status == '404'){
					//window.location.href = '404.html';		
				}
				//console.log(textStatus);
				//console.log(errorThrown);
			},
		});
	},
	logout:function(){
		$.cookie("sx_userInfo",'');//清除cookie
		var backUrl = encodeURIComponent(window.location.href.replace(window.location.search,''));//编码跳转链接
		window.location.href = 'login.html?burl='+ backUrl ;//跳转
	},
	// 加载页面分片
    loadPartial: function() {
        $(function() {
            $('[data-partial]').each(function(index, element) {
                var partialUrl = $(this).data('partial')
                $(this).load(partialUrl);
            });
        })
    },
	loadBaseData:function(type){
		if($.cookie("baseData") && $("#sys_alarm").length && !$("#sys_alarm").text()){
			var sys_data = $.parseJSON($.cookie("baseData"));
			sys_data.alarm_cnt && $("#sys_alarm").text(sys_data.alarm_cnt).attr('title','故障');
		}
		if($.cookie('sx_userInfo') && $.parseJSON($.cookie('sx_userInfo'))){//自动刷新不加载用户名
			var sx_userInfo = $.parseJSON($.cookie("sx_userInfo")),cookieTime = new Date();
			$("#user_name").text(sx_userInfo.user_name);//加载用户名
			cookieTime.setMinutes(+cookieTime.getMinutes()+10);//10分钟时间  总览页面 需要不停刷新 不停设置
            $.cookie("sx_userInfo",JSON.stringify(sx_userInfo),{ expires: cookieTime})
		}
		$('#user_identity').text($.cookie("sx_user_type"));

	},
	getUserData:function(){
		var sx_userInfo = $.cookie('sx_userInfo')?$.parseJSON($.cookie("sx_userInfo")):{};
		return sx_userInfo;
	}
};

$.extend({//扩展$.fn 方法
	format_number : function(number){//格式化数字  加逗号
		var b=parseInt(number).toString();
		var len=b.length;
		if(len<=3){return b;}
		var r=len%3;
		return r>0?b.slice(0,r)+","+b.slice(r,len).match(/\d{3}/g).join(","):b.slice(r,len).match(/\d{3}/g).join(",");	
	},
	getUrlParam : function(name){
        var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r!=null) return unescape(r[2]); return null;
    }

});
gs.func.loadBaseData();//加载故障、警告等基本信息
gs.func.loadPartial();