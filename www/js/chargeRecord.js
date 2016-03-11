$(function(){
	tableFunc.loadStation();
	laydate_func.init();
	$("#submit1").click(function(){
		$(this).addClass('disabled');
		$("#table_record").find('tbody').html('<tr class="odd"><td valign="top" colspan="'+ $("#table_record thead th").length +'" style="line-height:40px;font-size:16px;" class="dataTables_empty text-center">数据加载中.....</td></tr>')
		tableFunc.load_func(function(){
			$('#submit1').removeClass('disabled');
		})
	});
	$("#s_id").change(function(){
		var s_id = $(this).val();
		tableFunc.loadPile(s_id);
	});
});
var tableFunc = {
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
			    tableFunc.load_func();
			});
		});
	},
	load_func:function(callback){
		var charge_user = $("#charge_user").val(),
			p_id = $("#p_id").val(),
			end_time  =  $("#end_time").val(),
			fee_state = $("#fee_state").val(),
			start_time = $("#start_time").val(),
			s_id = $("#s_id").val();
		var subData = {
			charge_user : charge_user?charge_user:-1,//用户名，手机号，全部设置成-1
			s_id : s_id,//充电站名称，全部设置成-1
			p_id : p_id,//充电桩名称，全部设置成-1
			start_time : start_time?start_time:-1,//2020-10-10 22:22:22
			end_time : end_time?end_time:-1,//2020-10-10 22:22:22
			fee_state : fee_state//支付状态，3 充电中 6-待支付 7支付成功
		};
		var userInfoList = gs.func.getUserData();
		for(var key in userInfoList){//用户名 商户名 token数据加载
			subData[key] = userInfoList[key];
		}
		gs.func.callCgi(gs.cgi.web_dev_charge_record,subData,function(json){
			console.log(json);
			var table_list = json.data.charge_record;
			var feeState_enum = {3:'充电中',6:'待支付',7:'支付成功'};
			$("#table_record").dataTable({
				data:table_list,
	        	columns:[
	        		{title:'充电站名称',data:'station_name'},
	        		{title:'电桩编号',data:'pile_id'},
	        		{title:'充电电量',data:'charge_power'},
	        		{title:'充电费用(元)',data:'charge_fee'},
	        		{title:'服务费用(元)',data:'service_fee'},
	        		{title:'支付状态',data:'fee_state',defaultContent:'',render:function(data,type,row){
	        			return feeState_enum[row.fee_state];
	        		}},
	        		{title:'手机号',data:'user_name'},
	        		{title:'开始时间',data:'start_time'},
	        		{title:'结束时间',data:'end_time'},
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