
$(function(){
	thisFun.get_city();
});
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
			console.log(default_cityName);
			initMap(default_cityName,function(){
				thisFun.init(default_cityCode);
				$("#city_detail_tpl button").length || thisFun.loadCity(city_data,default_cityName);
			});
		});
	},
	init:function(city_code){
		map.clearOverlays();
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
	get_pile_detail:function(obj){
		console.log(infoData[obj.id.split('|')[0]]);
		map.closeInfoWindow();
		var cur_info = infoData[obj.id.split('|')[0]];
		var contentHtml = '';
		contentHtml += '<div id="pile_detail_content" style="width:95%;margin:0px auto;">';
		contentHtml += '<div class="row" id="pile_detail_table_content"><table id="pile_detail_table" width="100%" class="table table-striped table-bordered table-hover dataTable no-footer"></table></div>';
		contentHtml += '<div class="row"><div id="pile_real_data"></div></div></div>';
		layer.open({
			type:1,
			scrollbar :true,
			offset:'20px',
			title:'<b>'+cur_info.station_name +'</b>',
			area:['1100px','600px'],
			content:contentHtml,
			success: function(layero, index){
				var pile_type_enum = {
					1:'快充',
					2:'慢充'
				}
		        var pile_detail_table = $("#pile_detail_table").dataTable({
		        	data:cur_info.pile_list,
		        	columns:[
		        		{title:'编号',data:'pile_id'},
		        		{title:'名称',data:'pile_name'},
		        		{title:'类型',data:'pile_type',render:function(type,data,row){
		        			return pile_type_enum[row.pile_type];
		        		}},
		        		{title:'电压(V)',data:'volt'},
		        		{title:'电流(A)',data:'max_cur'},
		        		{title:'功率(kW)',data:'rated_power'},
		        		{title:'状态',data:'is_used',render:function(data,type,row){
		        			return row.is_used?gs_pile_state[row.status].text:'未启用'
		        		}},
		        		{title:'操作',orderable:false,className:'text-center',width:'130px',render:function(data,type,row){
		        			var btnHtml = '';
		        			btnHtml += '<div class="btn-group btn-group-justified" role="group">';
		        			btnHtml += '<div class="btn-group" role="group"><button data-role="start" type="button" '+(row.is_used?'':'disabled')+' class="btn charge_control btn-primary">启动</button></div>';
		        			btnHtml += '<div class="btn-group" role="group"><button data-role="stop" type="button" '+(row.is_used?'':'disabled')+' class="btn charge_control btn-danger">停止</button></div>';
		        			btnHtml += '<div class="btn-group" role="group"><button type="button" class="btn btn-success get_read_data">实时</button></div>';
		        			btnHtml += '</div>';
		        			return btnHtml
		        		}},
		        	],
		        	"fnInitComplete": function() {
	                	this.fnAdjustColumnSizing(true);//自动列宽
	                },
	                "aLengthMenu": [ 5, 25, 50, 100 ],
	                'bDestroy': true,
	                'bLengthChange': true,
					"dom": 'tp',
		        });

				$("#pile_detail_table").on('click','.charge_control',function(e){
					e.stopPropagation();
					var type = $(this).data('role');
					var $tr = $(this).parent().parent().parent().parent();
					var row = pile_detail_table.api().row($tr.index()).data();
					var url = (type == 'start')?gs.cgi.web_start_charge : gs.cgi.web_stop_charge;
					if(row.gun_num == 1){
						thisFun.chargeControlFun(row.pile_id,row.gun_num,url,$tr.index());
					}else{
						var radioHtml = '',title = '请选择需要'+(type == 'start'?'启动':'停止')+'的充电枪';
						for(var i = 1;i <= row.gun_num;i++){
							radioHtml += '<label class="radio-inline"><input name="gun_radio" type="radio" '+ (i==1?'checked="checked"':'') +' value="'+ i +'"/> 枪'+i+'</label>';
						}
						layer.confirm(radioHtml, {
							title:title,
						    btn: ['提交','取消'] //按钮
						}, function(index){//yes
						    thisFun.chargeControlFun(row.pile_id,$("input[name=gun_radio]:checked").val(),url,$tr.index());
						    layer.close(index);
						});
					}
				});
				$("#pile_detail_table").on('click','.get_read_data',function(e){
					e.stopPropagation();
					var $tr = $(this).parent().parent().parent().parent();
					var row = pile_detail_table.api().row($tr.index()).data();
					thisFun.web_get_pile_real_data(row.pile_id);
				});
		    },

		});
	},
	timeIndex:'',
	web_get_pile_real_data:function(pile_id,type){
		thisFun.timeIndex && clearTimeout(thisFun.timeIndex);
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		subData['pile_id'] = pile_id;
		gs.func.callCgi(gs.cgi.web_get_pile_real_data,subData,function(json){
			//console.log(json);
			var real_data = json.data.real_data;
			var laytpldata = {
				list:real_data,
				option:{
					alarm_status:{0:'没告警',1:'<span class="text-danger">告警</span>'},
					connect_status:{0:'断开',1:'半连接',2:'连接'},
					gun_type:{1:'快充',2:'慢充'},
					work_status:gs_pile_state//全局状态
				}
			}
			var template = $("#read_data_temp").html();
			laytpl(template).render(laytpldata, function(html){
			    if(laytpldata.list.length){
			    	$('#pile_real_data').html(html);
			    	thisFun.timeIndex = setTimeout(function(){
			    		thisFun.web_get_pile_real_data(pile_id);
			    	},15000);
			    }else{
			    	$('#pile_real_data').html('');
			    	type || layer.alert('暂无实时数据');
			    }
			});
		});
	},
	chargeControlFun:function(pile_id,gun_id,url,tr_index){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		subData['gun_id'] = gun_id;
		subData['pile_id'] = pile_id;
		gs.func.callCgi(url,subData,function(json){
			console.log(json);
			var updateObj = {'status':json.data.state}
			layer.alert(gs_pile_state[json.data.state].text,function(index){
				thisFun.update_pile_data('pile_detail_table',updateObj,tr_index);//更新行数据
				if(json.data.state == 108){
					$('#pile_real_data').html('');
					thisFun.web_get_pile_real_data(pile_id,'stop');
				}
				layer.close(index);
			});
		});
	},
	update_pile_data:function(tableId,row,row_index){
		var pile_detail_table = new $.fn.dataTable.Api("#"+tableId);
		var old_row = pile_detail_table.row(row_index).data();
		for(var key in row){
			old_row[key] = row[key];
		}
		pile_detail_table.row(row_index).data(old_row);
	}
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
	  parentdiv.style.width = '380px';
	  var cityname_childiv = '',  citylist_childiv = '';
	  cityname_childiv = '<div class="ui_city_change ui_city_change_top" style="position: relative; height: 26px;"><a href="javascript:void(0)" onclick="thisFun.openCityList(this,\'show\')" class="ui_city_change_inner" style="float: right"><span id="cur_city_name" class="cur_city_name">'+ city_ame +'</span><i><em></em></i></a></div>';
	  citylist_childiv += '<div class="citylist_popup_main" style="display: none;">';
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
var infoData = {};//存储每个信息弹窗的数据
function loadInfoWindow(positionData){
	var point = new BMap.Point(positionData.longitude,positionData.latitude,1);
	var icon_url = window.location.href.indexOf('local') != -1?"/Demo/img/tagging_02.png":"/chargeclound_web/img/tagging_02.png";
	var myicon = new BMap.Icon(icon_url, new BMap.Size(32, 32));
	var marker = new BMap.Marker(point,{icon:myicon});
	map.addOverlay(marker);
	marker.addEventListener("click",function(e){
		var point_content = '',pile_type = '',station_type = '',station_class = '',infowin_id = 'pile_info_'+ positionData.s_id;
        if (positionData.quick_pile_cnt > 0 && positionData.slow_pile_cnt == 0) {
            pile_type = '<span class="div_station_content_type_kuai">快充('+ positionData.quick_pile_cnt +'个)</span>';
        } else if (positionData.quick_pile_cnt == 0 && positionData.slow_pile_cnt > 0) {
            pile_type = '<span class="div_station_content_type_man">慢充('+ positionData.slow_pile_cnt +'个)</span>';
        } else if (positionData.quick_pile_cnt > 0 && positionData.slow_pile_cnt > 0) {
            pile_type = '<span class="div_station_content_type_kuai">快充('+ positionData.quick_pile_cnt +'个)</span><span class="div_station_content_type_man">慢充('+ positionData.slow_pile_cnt +'个)</span>';
        } else {
            pile_type = '<span class="div_station_content_type_man">无</span>';
        }
        var pileList = positionData.pile_list , pile_free_num = 0;
        for(var pile_index in pileList){
        	(pileList[pile_index].status == 100 ) && pile_free_num ++;
        }
        pile_type += '<span class="div_station_content_type_free">'+gs_pile_state[100].text+'('+ pile_free_num +'个)</span>';
        infoData[infowin_id] = positionData;
		point_content += ' <div id="'+ infowin_id +'|'+positionData.s_id+'" class="div_station_content_map" onclick="thisFun.get_pile_detail(this,\''+infowin_id+'\')">';
        point_content += ' <div class="div_station_content_title">';
        point_content += ' <div class="div_station_content_title_type ">';
        point_content += '';
        point_content += '</div>';
        point_content += '<div class="div_station_content_title_font_main_map">';
        point_content += '<span class="div_station_content_title_font">';
        point_content += positionData.station_name;
        point_content += '</span>';
        point_content += '</div>';
        point_content += '</div>';
        point_content += ' <div class="div_station_content_address_map"><span class="glyphicon glyphicon-map-marker div_station_content_title_font_main_map_address_marker" aria-hidden="true"></span><div class="div_station_content_title_font_main_map_address">' + positionData.address + '<div></div></div></div>';
        point_content += '<div class="div_station_content_type_map">';
        point_content += '<span class="glyphicon glyphicon-tags div_station_content_title_font_main_map_address_tags" aria-hidden="true" ></span>';
        point_content += pile_type;
        point_content += '</div>';
        point_content += '<hr class="hr_content" />';
        point_content += '</div>';
		var info = new BMap.InfoWindow(point_content, { enableMessage: false });
		map.openInfoWindow(info,e.point);
	});
	
}
