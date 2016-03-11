$(function(){
	var pile_id = $.getUrlParam("pile_id");
	pile_id = pile_id?pile_id:-1;
	var userInfoList = gs.func.getUserData(),subData = {};
	for(var key in userInfoList){//用户名 商户名 token数据加载
		subData[key] = userInfoList[key];
	}
	subData['pile_id'] = pile_id;
	gs.func.callCgi(gs.cgi.web_dev_ctrl_record,subData,function(json){
		//console.log(json);
		var table_list = json.data.record_data;
		$("#table_record").dataTable({
			data:table_list,
        	columns:[
        		{title:'电桩编号',data:'pile_id'},
        		{title:'电桩名称',data:'pile_name'},
        		{title:'充电枪编号',data:'gun_id'},
        		{title:'控制类型',data:'cmd_type',render:function(data,type,row){
        			return row.cmd_type == 1?'启动充电':'停止充电'
        		}},
        		{title:'控制结果',data:'ctrl_result',render:function(data,type,row){
        			return row.ctrl_result == 0?'成功':'失败'
        		}},
        		{title:'执行时间',data:'ctrl_time'},
        		{title:'执行用户',data:'ctrl_user'}
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
	});
});