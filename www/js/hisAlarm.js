$(function(){
	laydate_func.init();//初始化laydate时间插件参数
	thisFunc.loadStation();
	$("#submit1").click(function(){
		$(this).addClass("disabled");
		$("#table_hisAlarm tbody").html('<tr class="odd"><td valign="top" colspan="8" style="line-height:40px;font-size:16px;" class="dataTables_empty text-center">数据加载中.....</td></tr>');
		thisFunc.submit_func(function(){
			$("#submit1").removeClass("disabled");
		});
	});
	$("#s_id").change(function(){
		var s_id = $(this).val();
		thisFunc.loadPile(s_id);
	});
});
var firstLoad = true;
var thisFunc = {
	loadStation:function(){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		subData['city_code'] = 0;
		gs.func.callCgi(gs.cgi.web_get_station_list, subData,function(json){
			var template = '';
			template += '<option value="-1">全部</option>';
			template += '{{# for(var i=0,len=d.length;i<len;i++){ }}';
			template += '<option value="{{d[i].s_id}}">{{d[i].station_name}}</option>';
			template += '{{# } }}';
			laytpl(template).render(json.data.station_list, function(html){
			    $('#s_id').html(html).trigger('change');
			});
		});
	},
	loadPile:function(s_id){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		subData['s_id'] = s_id;
		gs.func.callCgi(gs.cgi.web_get_pile_list,subData,function(json){
			var template = '';
			template += '<option value="-1">全部</option>';
			template += '{{# for(var i=0,len=d.length;i<len;i++){ }}';
			template += '<option value="{{d[i].p_id}}">{{d[i].pile_name}}</option>';
			template += '{{# } }}';
			laytpl(template).render(json.data.pile_list, function(html){
			    $('#p_id').html(html);
			    firstLoad && thisFunc.submit_func();//初始化数据
			    firstLoad = false;
			});
		});
	},
	submit_func:function(callback){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){//用户名 商户名 token数据加载
			subData[key] = userInfoList[key];
		}
		subData['s_id'] = $("#s_id").val();
		subData['p_id'] = $("#p_id").val();
		subData['end_time'] = $.trim($("#end_time").val())?$.trim($("#end_time").val()):-1;
		subData['start_time'] = $.trim($("#start_time").val())?$.trim($("#start_time").val()):-1;
		subData['alarm_id'] = $.trim($("#alarm_id").val())?$.trim($("#alarm_id").val()):-1;
		subData['alarm_level'] = $.trim($("#alarm_level").val())?$.trim($("#alarm_level").val()):-1;
		gs.func.callCgi(gs.cgi.web_dev_his_alarm,subData,function(json){
			console.log(json);
			var table_list = json.data.his_alarm_data;
			var alarm_level_enum = {1:'普通',2:'警告',3:'故障'};
			$("#table_hisAlarm").dataTable({
				data:table_list,
	        	columns:[
	        		{title:'告警名称',data:'alarm_desc'},
	        		{title:'告警等级',data:'alarm_level',render:function(type,data,row){
	        			return alarm_level_enum[row.alarm_level];
	        		}},
	        		{title:'开始时间',data:'start_time'},
	        		{title:'结束时间',data:'end_time'},
	        		{title:'充电站名称',data:'station_name'},
	        		{title:'电桩编号',data:'pile_id'},
	        		{title:'充电枪编号',data:'gun_id',defaultContent:''},
	        		// {title:'告警等级',data:'alarm_level',render:function(type,data,row){
	        		// 	return alarm_level_enum[row.alarm_level];
	        		// }},
	        		{title:'充电站地址',data:'address'},
	        	],
				"fnInitComplete": function() {
                	this.fnAdjustColumnSizing(true);//自动列宽
                },
                'bDestroy': true,
                'bLengthChange': true,
				"dom": 'T<"clear">lfrt<"pull-left"i>p',
                "tableTools": {
                    "sSwfPath": "js/plugins/dataTables/swf/copy_csv_xls_pdf.swf",
                    "aButtons": [
	                    {
	                    	'sExtends':"xls",
	                    	'sButtonText':'导出',
	                    	'fnCellRender': function (sValue, iColumn, nTr, iDataIndex) {
	                    		var return_str = '';
	                    		if(isNaN(sValue)){
	                    			return_str = sValue;
	                    		}else{
	                    			return_str = "=\"" + sValue + "\"";
	                    		}
	                    		console.log(return_str);
	                    		return return_str;
	                    	}
	                    },
	                	{
	                		'sExtends':"print" ,
	                		'sButtonText':'打印',
	                		'sToolTip': "打印预览",
	                		'sInfo': "<h6>打印预览</h6><p>请使用浏览器的打印功能打印。返回请按ESC键</p>"
	                	}
                    ]
                }
			});
			// console.log(dataTable3);
			if(callback){
				callback();
			}
		});
	},
};
var laydate_func = {
	init:function(){
		laydate.skin('danlan');
		var start = {
			elem: '#start_time',
			format: 'YYYY-MM-DD hh:mm:ss',
			//min: laydate.now(), //设定最小日期为当前日期
			istime: true,//是否开启时间选择
			istoday: true,//是否显示今天
			choose: function(datas){
				end.min = datas; //开始日选好后，重置结束日的最小日期
				end.start = datas //将结束日的初始值设定为开始日
			}
		};
		var end = {
			elem: '#end_time',
			format: 'YYYY-MM-DD hh:mm:ss',
			//min: laydate.now(), //设定最小日期为当前日期
			istime: true,
			istoday: true,
			choose: function(datas){
				start.max = datas; //结束日选好后，重置开始日的最大日期
			}
		};
		laydate(start);
		laydate(end);
		$("#start_time").val(laydate.now(-30,'YYYY-MM-DD hh:mm:ss'));
		$("#end_time").val(laydate.now(0,'YYYY-MM-DD hh:mm:ss'));
	}
}