$(function(){
	
	tableFunc.load_func();
	laydate_func.init();

	$("#submit1").click(function(){
		//$(this).addClass('disabled');
		//$("#table_feeDetail").find('tbody').html('<tr class="odd"><td valign="top" colspan="8" style="line-height:40px;font-size:16px;" class="dataTables_empty text-center">数据加载中.....</td></tr>')
		tableFunc.load_func( function(){
			$('#submit1').removeClass('disabled');
		})
	});
});
var tableFunc = {
	table_feeDetail:'',
	load_func:function(callback){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){//用户名 商户名 token数据加载
			subData[key] = userInfoList[key];
		}
		subData['pay_type'] = $("#pay_type").val();
		subData['account_type'] = $("#account_type").val();
		subData['pay_user'] = $.trim($("#pay_user").val())?$.trim($("#pay_user").val()):-1;
		subData['end_time'] = $.trim($("#end_time").val())?$.trim($("#end_time").val()):-1;
		subData['start_time'] = $.trim($("#start_time").val())?$.trim($("#start_time").val()):-1;

		gs.func.callCgi(gs.cgi.web_fee_detail,subData,function(json){
			//console.log(json);
			var table_list = json.data.fee_data;
			var accountType_enum = {1:'微信支付',2:'余额支付'};
			var table_option = {
				data:table_list,
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
			}
			if(subData['pay_type'] == 1){//返回支付明细
				table_option['columns'] = [
	        		{title:'支付电站名',data:'station_name'},
	        		{title:'支付电桩编号',data:'pile_id'},
	        		{title:'支付类型',data:'account_type',render:function(data,type,row){
	        			return accountType_enum[row.account_type];
	        		}},
	        		{title:'支付金额(元)',data:'pay_value'},
	        		{title:'支付时间',data:'pay_time'},
	        		{title:'支付用户名',data:'user_name'}
	        	];
			}else{//返回充值明细
				table_option['columns'] = [
	        		{title:'充值用户名',data:'user_name'},
	        		{title:'充值金额(元)',data:'charge_value'},
	        		{title:'充值时间',data:'charge_time'}
	        	];
			}
			if(tableFunc.table_feeDetail){
				console.log(tableFunc.table_feeDetail);
				tableFunc.table_feeDetail._fnClearTable();
				tableFunc.table_feeDetail.fnDestroy();

			}
			tableFunc.table_feeDetail = $("#table_feeDetail").empty().dataTable(table_option);

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