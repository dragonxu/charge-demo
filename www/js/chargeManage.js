
$(function(){
	thisFun.get_city();
});
var gs_pile_state = {
	100:{text:'空闲',dec:'该电桩未被占用，电桩104帧上报空闲中状态'}
	,101:{text:'收到预约消息',dec:'app已经下发预约充电指令，后台也将该指令下发给电桩'}
	,102:{text:'预约中',dec:'电桩104帧上报已被预约状态'}
	,103:{text:'预约失败',dec:'电桩返回预约失败状态'}
	,104:{text:'收到开始充电消息',dec:'app下发开始充电指令，后台也将该指令下发给电桩'}
	,105:{text:'准备开始充电',dec:'电桩104帧上报准备开始充电状态'}
	,106:{text:'充电中',dec:'电桩104帧上报充电中状态'}
	,107:{text:'开始失败',dec:'电桩104帧上报启动失败状态'}
	,108:{text:'收到停止充电消息',dec:'app下发停止充电命令，后台也将该指令下发给电桩'}
	,109:{text:'停止失败',dec:'预留'}
	,110:{text:'后台svr故障造成电桩不可用',dec:'因为后台core，通信中断等原因造成电桩不可用'}
	,111:{text:'电桩自身故障造成不可用',dec:'预留'}
	,112:{text:'电桩被其他人占用',dec:'电桩被占用，不可充电'}
	,113:{text:'收到取消预约充电',dec:'取消预约充电命令发送后，会切换到该状态'}
}
var dataTable;
var thisFun = {
	get_city:function(){
		//组装提交参数
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		gs.func.callCgi(gs.cgi.web_get_city_list,subData,function(json){
			console.log(json);
			var city_data = json.data.city_data;
			var default_cityName = '',default_cityCode = '';
			//处理城市列表 抓取深圳市 如果没有深圳市则默认加载第一个城市
			if(!city_data.length) city_data = [{city:'深圳市',city_code:340}];
			for(var index in city_data){
				if(city_data[index].city == '深圳市'){
					default_cityName = city_data[index].city;
					default_cityCode = city_data[index].city_code;
				}else{
					default_cityName = city_data[0].city;
					default_cityCode = city_data[0].city_code;
				}
			}
			initMap(default_cityName,function(){
				thisFun.init(default_cityCode);
				$("#city_detail_tpl button").length || thisFun.loadCity(city_data,default_cityName);
			});
		});
	},
	init:function(city_code){
		map.clearOverlays();
		//组装提交参数
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		subData['city_code'] = city_code;
		gs.func.callCgi(gs.cgi.web_get_station_info,subData,function(json){
			// 加载地图方法
			for(var key in json.data.dev_data){
				loadInfoWindow(json.data.dev_data[key]);
			}
		});
	},
	openCityList:function(obj,type){
		type == 'show' && $(".citylist_popup_main").show();
		type == 'hide' && $(".citylist_popup_main").hide();
	},
	loadCity:function(optionList,city_ame){
		$("#city_detail_tpl").empty();
		for(var key in optionList){
			var btnClass = (city_ame.indexOf(optionList[key].city) == -1)?'btn-default':'btn-info';
			var btnHtml = '<button type="button" class="btn '+ btnClass +' btn-sm" onclick="thisFun.selectCity(this,\''+ optionList[key].city +'\','+ optionList[key].city_code +')">'+optionList[key].city+'</button>';
			$("#city_detail_tpl").append(btnHtml);
		}
	},
	selectCity:function(obj,city_name,city_code){
		$("#city_detail_tpl .btn-info").removeClass('btn-info').addClass('btn-default');
		$(obj).removeClass('btn-default').addClass('btn-info');
		$("#cur_city_name").text(city_name);
		$(".citylist_popup_main").hide();
		map.centerAndZoom(city_name,13);
		thisFun.init(city_code);
	},
	get_pile_detail:function(infoData){
		layer.open({
			type:1,
			scrollbar :false,
			offset:'20px',
			title:'<b>'+infoData.station_name +'</b>',
			area:['980px','580px'],
			content:'<div id="pile_detail_content" style="width:96%;margin:0px auto;"><table id="pile_detail_table" width="100%" class="table table-striped table-bordered table-hover dataTable no-footer"></table><div id="notable"></div></div>',
			success: function(layero, index){
				thisFun.fillTable(infoData.s_id);
		    },

		});
	},
	fillTable:function(s_id){
		$("#pile_detail_content").html('<table id="pile_detail_table" width="100%" class="table table-striped table-bordered table-hover dataTable no-footer"></table><div id="notable"></div>');
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		subData['s_id'] = s_id;
		gs.func.callCgi(gs.cgi.web_get_pile_list,subData,function(json){
			if(json.data.pile_list_len){
				dataTable = $("#pile_detail_table").dataTable({
		        	data:json.data.pile_list,
		        	columns:[
		        		{title:'编号',data:'pile_id'},
		        		{title:'名称',data:'pile_name'},
		        		{title:'类型',data:'pile_type',render:function(type,data,row){
		        			return row.pile_type == 1?'快充':'慢充';
		        		}},
		        		{title:'电压(V)',data:'volt'},
		        		{title:'电流(A)',data:'max_cur'},
		        		{title:'功率(kW)',data:'rated_power'},
		        		{title:'操作',orderable:false,className:'text-center',width:'90px',render:function(data,type,row){
		        			var btnHtml = '';
		        			btnHtml += '<div class="btn-group btn-group-justified" role="group">';
		        			btnHtml += '<div class="btn-group" role="group"><button onclick="stationFun.savePileZZ(\'change\',\''+row.s_id+'\',\''+ row.p_id+'\',\''+ row.pile_id+'\',\''+ row.pile_name +'\',\''+ row.gun_num +'\',\''+ row.pile_type +'\',\''+ row.rated_power +'\',\''+ row.max_cur +'\')" type="button" class="btn btn-primary">修改</button></div>';
		        			btnHtml += '<div class="btn-group" role="group"><button onclick="stationFun.savePile(\'delete\','+ row.s_id +','+row.p_id+')" type="button" class="btn btn-danger">删除</button></div></div>';
		        			return btnHtml
		        		}},
		        	],
		        	"fnInitComplete": function() {
	                	this.fnAdjustColumnSizing(true);//自动列宽
	                	$('.tableBtn').html('<button class="btn btn-success" <button class="btn btn-success" onclick="stationFun.pileFun(\'add\','+s_id+')">添加</button>');
	                	
	                },
	                'bDestroy': true,
	                'bLengthChange': true,
					"dom": 't<"row"<"tableBtn col-sm-6"><"col-sm-6"p>>',
		        });
			}else{
				var notable = '';
				notable += '<div class="text-center" style="line-height:200px"><span style="margin-right:20px">当前充电站没有电桩数据，请添加!</span>';
				notable += '<button class="btn btn-success" onclick="stationFun.pileFun(\'add\','+s_id+')">添加</button></div>';
				$("#notable").html(notable);
			}
		})
	},
	//充电桩启动 停止控制 分步处理中转
	chargeControl:function(obj,pile_id,gun_num,type){
		var url = '';
		url = (type == 'start')?gs.cgi.web_start_charge : gs.cgi.web_stop_charge;
		if(gun_num == 1){
			thisFun.chargeControlFun(pile_id,gun_num,url);
		}else{
			var radioHtml = '';
			for(var i = 1;i <= gun_num;i++){
				radioHtml += '<label class="radio-inline"><input name="gun_radio" type="radio" '+ (i==1?'checked="checked"':'') +' value="'+ i +'"/> 枪'+i+'</label>';
			}
			layer.confirm(radioHtml, {
				title:'请选择需要'+(type == 'start'?'启动':'停止')+'的充电枪',
			    btn: ['提交','取消'] //按钮
			}, function(index){//yes
			    thisFun.chargeControlFun(pile_id,$("input[name=gun_radio]:checked").val(),url);
			    layer.close(index);
			});
		}
		event.stopPropagation();
	},
	chargeControlFun:function(pile_id,gun_id,url){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		subData['gun_id'] = gun_id;
		subData['pile_id'] = pile_id;
		gs.func.callCgi(url,subData,function(json){
			console.log(json);
			layer.alert(gs_pile_state[json.data.state].text);
		});
	},
	setPosition:function(){
		var lat = $.trim($("#map_lat").val()),
			lng = $.trim($("#map_lng").val());
		var point = new BMap.Point(lng,lat);
		map.centerAndZoom(point,map.getZoom());
		add_marker.setPosition(point);

	},
};
var map,firstLoad = true;
function initMap(city_name,callback){
	map= new BMap.Map("baiduMap",{ minZoom: 4, maxZoom: 25 });
	map.enableScrollWheelZoom(true);//允许缩放
	map.centerAndZoom(city_name,13);
	addControl([],city_name);
	map.addEventListener("tilesloaded",function(){
		if(firstLoad){//避免重复加载 地图大小改变 等操作会出发地图重新初始化
			var top_left_control = new BMap.ScaleControl({anchor: BMAP_ANCHOR_BOTTOM_LEFT,offset:new BMap.Size(10, 40)});// 左上角，添加比例尺
			var top_left_navigation = new BMap.NavigationControl({anchor:BMAP_ANCHOR_BOTTOM_RIGHT,type:BMAP_NAVIGATION_CONTROL_LARGE,showZoomInfo:true});  //左上角，添加默认缩放平移控件
			map.addControl(top_left_control);        
			map.addControl(top_left_navigation); 
			addNewStationCrt();
			callback();
			firstLoad = false;
		}
	});
}
function addControl(optionList,city_ame){
	function ZoomControl(){// 定义一个控件类,即function
	  this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;// 默认停靠位置和偏移量
	  this.defaultOffset = new BMap.Size(10, 10);
	}
	ZoomControl.prototype = new BMap.Control();
	ZoomControl.prototype.initialize = function(map){
	  var parentdiv = document.createElement("div");// 创建一个父类DOM元素
	  parentdiv.className = 'BMap_CityListCtrl';
	  parentdiv.style.width = parentdiv.style.height = 'auto';
	  var cityname_childiv = '',  citylist_childiv = '';
	  cityname_childiv = '<div class="ui_city_change ui_city_change_top" style="position: relative; height: 26px;"><a href="javascript:void(0)" onclick="thisFun.openCityList(this,\'show\')" class="ui_city_change_inner" style="float: right"><span id="cur_city_name" class="cur_city_name">'+ city_ame +'</span><i><em></em></i></a></div>';
	  citylist_childiv += '<div class="citylist_popup_main" style="display: none;width:380px;">';
	  citylist_childiv += '<div class="citylist_ctr_title">城市列表</div>';
	  citylist_childiv += '<div class="citylist_ctr_content"><div class="city_content_bottom" id="city_detail_tpl">';
	  citylist_childiv += '</div></div><button id="popup_close" onclick="thisFun.openCityList(this,\'hide\')"></button></div>';
	  parentdiv.appendChild($(cityname_childiv)[0]);// 添加当前城市名列表
	  parentdiv.appendChild($(citylist_childiv)[0]);// 添加当前城市名列表
	  // 添加DOM元素到地图中
	  map.getContainer().appendChild(parentdiv);
	  // 将DOM元素返回
	  return parentdiv;
	}
	// 创建控件
	var myZoomCtrl = new ZoomControl();
	// 添加到地图当中
	map.addControl(myZoomCtrl);
}
function addNewStationCrt(){
	function ZoomControl(){// 定义一个控件类,即function
	  this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;// 默认停靠位置和偏移量
	  this.defaultOffset = new BMap.Size(90, 10);
	}
	ZoomControl.prototype = new BMap.Control();
	ZoomControl.prototype.initialize = function(map){
	  var parentdiv = document.createElement("div");// 创建一个父类DOM元素
	  parentdiv.className = 'BMap_CityListCtrl';
	  parentdiv.style.width = parentdiv.style.height = 'auto';
	  var newStationBtn = '';
	  newStationBtn += '<div class="ui_city_change ui_city_change_top" style="position: relative; height: 26px;">';
	  newStationBtn += '<a href="javascript:void(0)" onclick="stationFun.addStation(this)" id="newStation" class="ui_city_change_inner" style="float: right">';
	  newStationBtn += '<span class="cur_city_name">新增</span></a></div>';
	  parentdiv.appendChild($(newStationBtn)[0]);
	  map.getContainer().appendChild(parentdiv);
	  // 将DOM元素返回
	  return parentdiv;
	}
	// 创建控件
	var myZoomCtrl = new ZoomControl();
	// 添加到地图当中
	map.addControl(myZoomCtrl);
}
var infoData = {};//存储每个信息弹窗的数据
function loadInfoWindow(positionData){
	var point = new BMap.Point(positionData.longitude,positionData.latitude,1);
	var icon_url = window.location.href.indexOf('local') != -1?"/Demo/img/tagging_02.png":"/chargeclound_web/img/tagging_02.png";
	var myicon = new BMap.Icon(icon_url, new BMap.Size(32, 32));
	var marker = new BMap.Marker(point,{icon:myicon});
	map.addOverlay(marker);
	//添加右键菜单
	marker.posData = positionData;//存储数据
	var markerMenu=new BMap.ContextMenu();
	markerMenu.addEventListener('open',function(){
		map.closeInfoWindow();
	});
	markerMenu.addItem(new BMap.MenuItem('<span class="menuItem text-primary">删除</span>',mapFun.contextMenuFun.bind(marker,'DELETE')));
	markerMenu.addItem(new BMap.MenuItem('<span class="menuItem text-primary">修改</span>',mapFun.contextMenuFun.bind(marker,'CHANGE')));
	marker.addContextMenu(markerMenu);
	//信息框
	marker.addEventListener("click",function(e){
		console.log(this);
		thisFun.get_pile_detail(this.posData);
	});
	
}
var mapFun = {
	contextMenuFun:function(type,point,position,marker){
		var positionData = marker.posData;
		if(type == 'DELETE'){
			var confirmText = '您确定要删除 <b>'+marker.posData.station_name+'</b> 充电站吗？';
			layer.confirm(confirmText
			,function(){//yes
				stationFun.saveStat('delete',positionData);
			});
		}else if(type == 'CHANGE'){
			layer.closeAll();
			var label = new BMap.Label("移动我选点",{offset:new BMap.Size(20,-10)});
			change_marker = new BMap.Marker(new BMap.Point(positionData.longitude,positionData.latitude));  // 创建标注
			change_marker.setLabel(label);
			map.addOverlay(change_marker); 
			change_marker.setAnimation(BMAP_ANIMATION_DROP); //跳动的动画
			change_marker.enableDragging();
			var content_html = '';
			content_html += '<form id="change_station_form" action="#">';
			content_html += '<div id="change_station" class="m-t-15 newStation">';
			content_html += '<div class="form-group clearfix">'
			content_html += '<div  class="form-group pull-left l-h-30"><label class="my_label">纬度：</label><div class="my_input"><input type="text" class="form-control" id="change_map_lat" placeholder="纬度" required/></div></div>'
			content_html += '<div class="col-md-2" style="float:right;margin-top:20px;"><button type="button" class="btn btn-info" onclick="thisFun.setPosition()">定位</button></div>'
			content_html += '<div  class="form-grou pull-left l-h-30 m-n"><label class="my_label">经度：</label><div class="my_input"><input type="text" class="form-control" id="change_map_lng" placeholder="经度" required/></div></div>'
			
			content_html += '</div>';
			content_html += '<div  class="form-group clearfix"><label class="my_label">充电站名称：</label><div class="my_input"><input type="text" class="form-control" id="change_station_name" required/></div></div>';
			content_html += '<div  class="form-group clearfix"><label class="my_label">充电站地址：</label><div class="my_input"><input type="text" class="form-control" id="change_station_addr" required/></div></div>'
			content_html += '<div><div class="col-md-5 text-right"><button type="submit" class="btn btn-success" id="changeSub">提交</button></div><div class="col-md-5 text-left"><button type="button" class="btn btn-primary" onclick="layer.closeAll()">取消</button></div></div>';
			content_html += '</div></form>';
			layer.open({
				type:1,
				title:'修改充电站',
				offset:['10px','10px'],
				area:['450px','300px'],
				shade:false,
				content:content_html,
				success:function(layero,index){
					$("#change_map_lat").val(positionData.latitude);
					$("#change_map_lng").val(positionData.longitude);
					$("#change_station_name").val(positionData.station_name);
					$("#change_station_addr").val(positionData.address);
					$("#change_station_form").submit(function(){
						stationFun.saveStat('change',positionData);
						return false;
					});
				},
				end:function(layero,index){
					map.removeOverlay(change_marker);
				}
			});

			change_marker.addEventListener('dragging',function(e){
				console.log(e);
				$("#change_map_lat").val(e.point.lat);//纬度
				$("#change_map_lng").val(e.point.lng);//经度
			});
		}
	}
}

var stationFun = {
	addStation:function(obj){
		if($("#add_station").length) return false;
		var label = new BMap.Label("移动我选点",{offset:new BMap.Size(20,-10)});
		//add_marker && 
		add_marker = new BMap.Marker(map.getCenter());  // 创建标注
		add_marker.setLabel(label);
		map.addOverlay(add_marker); 
		add_marker.setAnimation(BMAP_ANIMATION_DROP); //跳动的动画
		add_marker.enableDragging();
		var content_html = '';
		content_html += '<form action="#" id="add_station_form">';
		content_html += '<div id="add_station" class="m-t-15 newStation">';
		content_html += '<div class="form-group clearfix">'
		content_html += '<div  class="form-group pull-left l-h-30"><label class="my_label">纬度：</label><div class="my_input"><input type="text" class="form-control" id="map_lat" placeholder="纬度" required/></div></div>'
		content_html += '<div class="col-md-2" style="float:right;margin-top:20px;"><button type="button" class="btn btn-info" onclick="thisFun.setPosition()">定位</button></div>'
		content_html += '<div  class="form-grou pull-left l-h-30 m-n"><label class="my_label">经度：</label><div class="my_input"><input type="text" class="form-control" id="map_lng" placeholder="经度" required/></div></div>'
		
		content_html += '</div>';
		content_html += '<div  class="form-group clearfix"><label class="my_label">充电站名称：</label><div class="my_input"><input type="text" class="form-control" id="station_name" required/></div></div>';
		content_html += '<div  class="form-group clearfix"><label class="my_label">充电站地址：</label><div class="my_input"><input type="text" class="form-control" id="station_addr" required/></div></div>'
		content_html += '<div><div class="col-md-5 text-right"><button type="submit" class="saveBtn btn btn-success">提交</button></div><div class="col-md-5 text-left"><button type="button" class="btn btn-primary" onclick="layer.closeAll()">取消</button></div></div>';
		content_html += '</div></from>';
		layer.open({
			type:1,
			title:'添加充电站',
			offset:['10px','10px'],
			area:['450px','300px'],
			shade:false,
			content:content_html,
			success:function(layero,index){
				console.log(add_marker.getPosition());
				$("#map_lat").val(add_marker.getPosition().lat);
				$("#map_lng").val(add_marker.getPosition().lng);
				$("#add_station_form").submit(function(){
					stationFun.saveStat('add');
					return false;
				});
			},
			end:function(layero,index){
				map.removeOverlay(add_marker);
			}
		});

		add_marker.addEventListener('dragging',function(e){
			console.log(e);
			$("#map_lat").val(e.point.lat);//纬度
			$("#map_lng").val(e.point.lng);//经度
		});
	},
	saveStat:function(type,data,callback){
		var latitude,longitude;
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		if(type == 'add'){//新增操作
			var aletText = '添加成功！';
			subData['cmd_type'] = 1;//添加为1  修改 为3 删除为2
			subData['latitude'] = latitude = $.trim($("#map_lat").val());//纬度
			subData['longitude'] = longitude = $.trim($("#map_lng").val());//经度
			subData['station_name'] = $.trim($("#station_name").val());
			subData['address'] = $.trim($("#station_addr").val());
			
		}else if(type == 'change'){
			var aletText = '修改成功！';
			subData['cmd_type'] = 3;//添加为1  修改 为3 删除为2
			subData['s_id'] = data.s_id;
			subData['latitude'] = latitude = $.trim($("#change_map_lat").val());//纬度
			subData['longitude'] = longitude = $.trim($("#change_map_lng").val());//经度
			subData['station_name'] = $.trim($("#change_station_name").val());
			subData['address'] = $.trim($("#change_station_addr").val());
		}else if(type == 'delete'){
			var aletText = '删除成功！';
			latitude = data.latitude;
			longitude = data.longitude;
			subData['cmd_type'] = 2;//添加为1  修改 为3 删除为2
			subData['s_id'] = data.s_id;
		}
		var request_content = '';
		request_content = 'ak=5kPj7xyvFpwXBZcTVDp00PrB&location='+latitude+','+longitude+'&output=json';
		$.ajax({
			url:'http://api.map.baidu.com/geocoder/v2/',
			data:request_content,
			type:'get',
			dataType:'jsonp',
			success:function(json){
				if(json.status == 0){
					var city_code = json.result.cityCode;
					var city_name = json.result.addressComponent.city;//添加完成后 默认加载地区数据
					(type == 'delete') || (subData['city_code'] = city_code);
					gs.func.callCgi(gs.cgi.web_station_oper,subData,function(json){
						console.log(json);
						layer.closeAll();
						layer.alert(aletText,function(layer_index){
							layer.close(layer_index);
							thisFun.init(city_code);
						});
						

					});
				}else{//获取当前坐标信息异常

				}
			}
		});
	},
	savePileZZ:function(type,s_id,p_id,pile_id,pile_name,gun_num,pile_type,rated_power,max_cur){
		var pile_data = {'s_id':s_id,'p_id':p_id,'pile_id':pile_id,'gun_num':gun_num,'pile_name':pile_name,'pile_type':pile_type,'rated_power':rated_power,'max_cur':max_cur}
		this.pileFun(type,pile_data);
	},
	pileFun:function(type,data){
		if(typeof data == 'object'){
			var s_id = data.s_id;
			var p_id = data.p_id;
		}else{
			var s_id = data;
			var p_id;
		}
		var content_html = '';
		content_html += '<form action="#" id="ac_pile">';
		content_html += '<div id="add_pile_content" class="m-t-15 newStation">';
		content_html += '<div class="form-group clearfix"><label class="my_label">电桩编号：</label><div class="my_input"><input type="text" class="form-control" id="pile_id" required/></div></div>'
		content_html += '<div class="form-group clearfix"><label class="my_label">电桩名：</label><div class="my_input"><input type="text" class="form-control" id="pile_name" required/></div></div>'
		content_html += '<div class="form-group clearfix"><label class="my_label">电桩类型：</label><div class="my_input" id="pile_type">';
		content_html += '<label class="radio-inline"><input type="radio" name="add_pile" value="1" checked/> 快充</label>';
		content_html += '<label class="radio-inline"><input type="radio" name="add_pile" value="2"/> 慢充</label>';
		content_html += '</div></div>';
		content_html += '<div class="form-group clearfix"><label class="my_label">充电枪数量：</label><div class="my_input"><input type="text" class="form-control" id="gun_num" required/></div></div>';
		content_html += '<div class="form-group clearfix"><label class="my_label">电压(v)：</label><div class="my_input"><input type="text" class="form-control" id="volt" value="220" required/></div></div>';
		content_html += '<div class="form-group clearfix"><label class="my_label">额定功率(KW)：</label><div class="my_input"><input type="text" class="form-control" id="rated_power" required/></div></div>';
		content_html += '<div class="form-group clearfix"><label class="my_label">最大充电电流(A)：</label><div class="my_input"><input type="text" class="form-control" id="max_cur" required/></div></div>';
		content_html += '<div><div class="col-md-5 text-right"><button type="submit" class="btn btn-success">提交</button></div><div class="col-md-5 text-left"><button type="button" id="pile_cancel" class="btn btn-primary">取消</button></div></div>';
		content_html += '</div></form>';
		layer.open({
			type:1,
			scrollbar :false,
			offset:'20px',
			title: type == 'add'?'添加电桩':'修改电桩',
			area:['450px','450px'],
			content:content_html,
			success:function(layero,index){
				if(type == 'change'){
					console.log(data);
					for(var key in data){
						console.log($("#"+key));
						if($("#"+key).length && $("#"+key).find('input[type=radio]').length){
							$("#"+key).find('input[type=radio]').each(function(){
								(this.value == data[key]) &&  (this.checked = true);
							});
						}else if($("#"+key).length){
							$("#"+key).val(data[key]);
						}
					}
				}
				//表单提交事件
				$("#ac_pile").submit(function(){
					stationFun.savePile(type,s_id,p_id)
					return false;
				});
				//关闭弹窗
				$("#pile_cancel").on('click',function(){
					layer.close(index);
				});
			},
			end:function(){

			}
		});
	},
	savePile:function(type,s_id,p_id){
		console.log(this);
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		if(type == 'add'){
			var aletText = '添加成功！';
			subData['cmd_type'] = 1;//添加为1  修改 为3 删除为2
			subData['s_id'] = s_id;
			subData['volt'] = $.trim($("#volt").val());
			subData['pile_id'] = $.trim($("#pile_id").val());
			subData['pile_name'] = $.trim($("#pile_name").val());//经度
			subData['pile_type'] = $("#pile_type :checked").val();
			subData['gun_num'] = $.trim($("#gun_num").val());
			subData['rated_power'] = $.trim($("#rated_power").val());
			subData['max_cur'] = $.trim($("#max_cur").val());
		}else if(type == 'delete'){
			var aletText = '删除成功！';
			subData['cmd_type'] = 2;//添加为1  修改 为3 删除为2
			subData['s_id'] = s_id;
			subData['p_id'] = p_id;
			//删除特殊处理
			layer.confirm('您确定要删除此充电桩吗？',function(con_index){
				gs.func.callCgi(gs.cgi.web_pile_oper,subData,function(json){
					layer.alert(aletText,function(layer_index){
						layer.close(layer_index);
						$("#pile_cancel").trigger('click');
						thisFun.fillTable(s_id);
					});
				});
			})
			return false;
		}else if(type == 'change'){
			var aletText = '修改成功！';
			subData['cmd_type'] = 3;//添加为1  修改 为3 删除为2
			subData['s_id'] = s_id;
			subData['p_id'] = p_id;
			subData['pile_id'] = $.trim($("#pile_id").val());
			subData['pile_name'] = $.trim($("#pile_name").val());//经度
			subData['pile_type'] = $("#pile_type :checked").val();
			subData['gun_num'] = $.trim($("#gun_num").val());
			subData['rated_power'] = $.trim($("#rated_power").val());
			subData['max_cur'] = $.trim($("#max_cur").val());
		}
		gs.func.callCgi(gs.cgi.web_pile_oper,subData,function(json){
			layer.alert(aletText,function(layer_index){
				layer.close(layer_index);
				$("#pile_cancel").trigger('click');
				thisFun.fillTable(s_id);
			});
		});
	}
}