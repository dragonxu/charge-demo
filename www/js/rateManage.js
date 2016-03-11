$(function(){
	//thisFun.init();
	thisFun.init_cityList();
	$("#city_data").change(function(){
		thisFun.init_station($(this).val());
	});
	$("#station_data").change(function(){
		thisFun.init();
	});
	
})
var thisFun = {
	cur_city_code:'',
	init_cityList:function(){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){//用户名 商户名 token数据加载
			subData[key] = userInfoList[key];
		}
		$("#city_data").html('<option>加载中...</option>');
		gs.func.callCgi(gs.cgi.web_get_city_list,subData,function(json){
			console.log(json);
			var city_data = json.data.city_data,optionHtml = '';
			for(var key in city_data){
				optionHtml +='<option value="'+city_data[key].city_code+'">'+city_data[key].city+'</option>';
			}
			city_data.length || (optionHtml = '<option value="-1">无数据</option>');
			$("#city_data").html(optionHtml).trigger('change');
		});
	},
	init_station:function(city_code){
		if(city_code == -1){
			$("#station_data").html('<option value="-1">无数据</option>').trigger('change');
			return false;
		}
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){//用户名 商户名 token数据加载
			subData[key] = userInfoList[key];
		}
		subData['city_code'] = city_code;
		$("#station_data").html('<option>加载中...</option>');
		gs.func.callCgi(gs.cgi.web_get_station_info,subData,function(json){
			console.log(json);
			var dev_data = json.data.dev_data,optionHtml = '';
			optionHtml = '<option value="-1">全部</option>';
			for(var key in dev_data){
				optionHtml +='<option value="'+dev_data[key].s_id+'">'+dev_data[key].station_name+'</option>';
			}
			$("#station_data").html(optionHtml).trigger('change');
		});
	},

	init:function(city_code,s_id){
		if(city_code == -1 && s_id == -1){
			thisFun.loadTable([]);
			return false;
		}
		city_code || (city_code = $("#city_data").val());
		s_id || (s_id = $("#station_data").val());
		thisFun.cur_city_code = city_code;//存储当前操作的城市代码
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){//用户名 商户名 token数据加载
			subData[key] = userInfoList[key];
		}
		subData['s_id'] = s_id;
		subData['city_code'] = city_code;
		gs.func.callCgi(gs.cgi.web_service_fee_query,subData,function(json){
			console.log(json);
			var station_fee = json.data.station_fee;
			thisFun.loadTable(station_fee);
		});
		
		
	},
	loadTable:function(station_fee){
		var row_data_index = 0;
		var option = {
			data:station_fee,
			"fnInitComplete": function() {
            	this.fnAdjustColumnSizing(true);//自动列宽
            },
        	columns:[
        		{'title':'充电站名','className':"text-center",'data':'station_name'},
        		{'title':'地址','className':"text-center",'data':'address'},
        		{'title':'电费','data':'charge_fee','className':"text-center",'render':function(type,data,row){
        			if(row.is_step == 0){
        				return row.charge_fee == '-'?row.charge_fee:row.charge_fee + '元/度';
        			}else{
        				var is_step = row.is_step,charge_fee = row.charge_fee,station_name = row.station_name,service_fee = row.service_fee;
        				return '<button onclick="thisFun.view_fee_set(\''+is_step+'\',\''+charge_fee+'\',\''+station_name+'\',\''+service_fee+'\')" class="btn btn-success">查看</button>'
        			}
        		}},
        		{'title':'服务费','data':'service_fee','className':"text-center",'render':function(type,data,row){
        			return row.charge_fee == '-'?row.charge_fee:row.service_fee + '元/度';
        		}},
        		{'title':'操作','className':"text-center",'width':'100px','render':function(type,data,row){
        			var is_step = row.is_step,charge_fee = row.charge_fee,station_name = row.station_name,service_fee = row.service_fee;
        			return '<button onclick="thisFun.show_fee_set(\''+is_step+'\',\''+charge_fee+'\',\''+station_name+'\',\''+service_fee+'\')" class="btn btn-primary">设置</button>'
        		}}
        	],
        	'sort':false,
            'bDestroy': true,
            'bLengthChange': true,
		}
		option['dom'] = station_fee.length > 10?'T<"clear">lfrt<"pull-left"i>p':'t';
		var user_table = $("#table_fee").dataTable(option);
	},
	show_fee_set:function(is_step,charge_fee,station_name,service_fee){
		layer.open({
			type:1,
			scrollbar :false,
			offset:'20px',
			title: '费率设置',
			area:['900px','580px'],
			content:'<div style="width:600px;margin:20px auto;">'+$("#normal_fee_config").html()+'</div>',
			success:function(layero,index){
				thisFun.load_staiotn_list(station_name);
				$("#is_step").on('click','input[type=radio]',function(){
					thisFun.change_step(this.value,charge_fee,index);
				});
				$("#is_step input[value="+is_step+"]").attr('checked',true).trigger('click');//初始化收费方式
				$("#service_fee").val(service_fee != '-'?service_fee:'');
				if(is_step == 1){

				}else{

				}
			}
		});
	},
	view_fee_set:function(is_step,charge_fee,station_name,service_fee){
		layer.open({
			type:1,
			scrollbar :false,
			shadeClose:true,
			offset:'20px',
			title: '<b>'+ station_name +'</b>费率设置',
			area:['900px','580px'],
			content:'<div style="width:600px;margin:20px auto;">'+$("#normal_fee_config").html()+'</div>',
			success:function(layero,index){
				$("#station_row,#btn_row").hide();//隐藏电站列表 按钮行
				$("#is_step").on('click','input[type=radio]',function(){
					thisFun.change_step(this.value,charge_fee,index);
				});
				$("#is_step input[value="+is_step+"]").attr('checked',true).trigger('click');//初始化收费方式
				$("#is_step input").attr('disabled',true);
				$("#service_fee").val(service_fee);
				if(is_step == 1){

				}else{
					$("#charge_fee").val(charge_fee);
					layer.style(index, {height: '380px'}); 
				}
			}
		});
	},
	load_staiotn_list:function(station_name){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){//用户名 商户名 token数据加载
			subData[key] = userInfoList[key];
		}
		subData['city_code'] = thisFun.cur_city_code;
		console.log(thisFun);
		gs.func.callCgi(gs.cgi.web_get_station_list,subData,function(json){
			console.log(json);
			var station_list = json.data.station_list,checkboxhtml = '';
			for(var index in station_list){
				var checkstate = station_name == station_list[index].station_name?' checked':'';
				checkboxhtml +='<label class="checkbox-inline"><input type="checkbox" '+ checkstate +' value="'+ station_list[index].s_id +'" /> '+station_list[index].station_name+'</label>';
			}
			$("#station_name").html(checkboxhtml);
		});
	},
	change_step:function(type,value,index){
		var charge_row = '';
		value = value == '-'?'0.61':value;
		value = value.indexOf('|')!= -1?value.split('|') : [value];
		console.log(value);
		layer.style(index, {height: type == 1?'580px':'380px'});  
		if(type ==1){
			for(var t = 0; t< 24;t++){
				var time_text = '';
				time_text += (t < 10?'0'+t:t)+':00 ~ ';
				time_text += ((t+1 < 10?'0'+(t+1):t+1) == 24 ? '00': (t+1 < 10?'0'+(t+1):t+1) )+':00';
				charge_row += '<div class="charge_row clearfix">';
				charge_row += '<span class="time_label pull-left">'+ time_text  +'</span>';
				charge_row += '<div class="my_input pull-left"><input type="text" class="form-control charge_fee" value="'+ (value[t]?value[t]:'0.61')+'" required/></div>';
				charge_row += '<span class="unit_label">元/度</span></div>';
			}
		}else{
			charge_row += '<div class="charge_row">';
            charge_row += '<div class="my_input pull-left"><input type="text" value="'+ (value[0]?value[0]:'0.61')+'" class="form-control" id="charge_fee" required/></div>';
            charge_row += '<span class="unit_label">元/度</span></div>' ;
		}
		$("#charge_list").html(charge_row);
	},

	submit:function(){
		var is_step = '',s_id_list = [],charge_fee = [],service_fee = '';
		is_step = $("#is_step :checked").val();
		service_fee = $.trim($("#service_fee").val());
		if(is_step == 0){
			charge_fee = $.trim($("#charge_fee").val());
		}else{
			$("#charge_list input.charge_fee").each(function(i,el){
				charge_fee.push(el.value);
			});
			charge_fee = charge_fee.join('|');
		}
		$("#station_name :checked").each(function(index,element){
			s_id_list.push(element.value);
		});
		if(!s_id_list.length){
			layer.alert('请至少选择一个电站');
			return false;
		}
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){//用户名 商户名 token数据加载
			subData[key] = userInfoList[key];
		}
		subData['is_step'] = is_step;
		subData['s_id_list'] = s_id_list.join('|');
		subData['charge_fee'] = charge_fee;
		subData['service_fee'] = service_fee;
		gs.func.callCgi(gs.cgi.web_service_fee_oper,subData,function(json){
			console.log(json);
			layer.alert('设置成功',function(index){
				layer.closeAll();
				thisFun.init();
			});
		});

	}
}