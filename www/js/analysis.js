require.config({
	paths: {
		echarts: './js/plugins/echarts'
	}
});
var echart;
gs.myChart = myChart = {
	totalPile:{// 
		chart:'',
		DOM:document.getElementById('totalPile')
	},
	chargeBar:{
		chart:'',
		DOM:document.getElementById('chargeBar')
	},
	maintenLine:{//今日概况
		chart:'',
		DOM:document.getElementById('maintenLine')
	},
	countLine:{//今日概况
		chart:'',
		DOM:document.getElementById('countLine')
	}
}
$(function(){
	laydate_func.init();
	thisFun.loadStation();
	require(
        [
            'echarts',
            'echarts/chart/pie',
			'echarts/chart/line',
			'echarts/chart/bar'
        ],
        function (ec) {
            echart = ec;
			myChart.totalPile.chart = ec.init(myChart.totalPile.DOM);
			myChart.maintenLine.chart = ec.init(myChart.maintenLine.DOM);//
			myChart.chargeBar.chart = ec.init(myChart.chargeBar.DOM);
			myChart.countLine.chart = ec.init(myChart.countLine.DOM);
			
			var loadOption = {
				effect:'bubble',
				textStyle:{
					fontSize:16,
					fontWeight:'bold',
					color:'#000000'
				}
			}
			myChart.totalPile.chart.showLoading(loadOption);	
			myChart.maintenLine.chart.showLoading(loadOption);
			myChart.countLine.chart.showLoading(loadOption);
			myChart.chargeBar.chart.showLoading(loadOption);	
			thisFun.init();
        }
		
    );

})
var thisFun = {
	loadStation:function(){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		subData['city_code'] = 0;
		gs.func.callCgi(gs.cgi.web_get_station_list, subData,function(json){
			var template = '';
			template += '<option value="0">全部</option>';
			template += '{{# for(var i=0,len=d.length;i<len;i++){ }}';
			template += '<option value="{{d[i].s_id}}">{{d[i].station_name}}</option>';
			template += '{{# } }}';
			laytpl(template).render(json.data.station_list, function(html){
			    document.getElementById('s_id').innerHTML = html;
			});
		});
	},
	init:function(){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}
		subData['s_id'] = $.trim($('#s_id').val()) ? $.trim($('#s_id').val()) : 0;
		subData['start_time'] =$.trim($('#start_time').val()) ? $.trim($('#start_time').val()) : -1;
		subData['end_time'] = $.trim($('#end_time').val()) ? $.trim($('#end_time').val()) : -1;
		gs.func.callCgi(gs.cgi.web_analysis, subData,function(json){
			var status_data = json.data.status_data;
			thisFun.draw_totalPile(status_data);//饼图
			var charge_data = json.data.charge_data;
			thisFun.draw_chargeBar(charge_data);
			thisFun.translateDraw(charge_data);
		})
	},
	draw_totalPile:function(data){
		if (myChart.totalPile.chart && myChart.totalPile.chart.dispose) {
			myChart.totalPile.chart.hideLoading();
			myChart.totalPile.chart.dispose();
			myChart.totalPile.chart = echart.init(myChart.totalPile.DOM);
		}
		var pieList = [],legendList = [];
		for(var key in data){
			pieList.push({
				'value':data[key].pile_cnt,
				'name_text': gs_pile_state[data[key].work_status].text + data[key].pile_cnt,
				'name':gs_pile_state[data[key].work_status].text
			});
			legendList.push(gs_pile_state[data[key].work_status].text);
		}
		myChart.totalPile.chart.setOption({
			title:{
				text:'电桩状态概览',
			},
			tooltip : {
				trigger: 'item',
				show: true,
				formatter: function(a,b,c){
					return a[0]+'<br>'+a.data.name + '：' + a.data.value;
				}
			},	
			noDataLoadingOption:{
				text:'暂无数据',
				effect:'bubble',
				textStyle:{
					fontSize:16,
					fontWeight:'bold',
					color:'#000000'
				}	
			},	
			legend: {
		        orient : 'horizontal',
		        x : 'center',
		        y : 'top',
		        data:legendList
		    },
			series : [
				{
					name:'概况',
					type:'pie',
					radius : '55%',
					center: ['50%', '50%'],
					data:pieList,
					itemStyle:{
						normal:{
							label:{
								formatter:function(a){
									return a.data.name_text;
								}
							}
						}
					}
				}
			]
		});
	},
	draw_chargeBar:function(data){
		if (myChart.chargeBar.chart && myChart.chargeBar.chart.dispose) {
			myChart.chargeBar.chart.hideLoading();
			myChart.chargeBar.chart.dispose();
			myChart.chargeBar.chart = echart.init(myChart.chargeBar.DOM);
		}
		var barList = {'fee':[],'power':[],'xList':[]};
		for(var key in data){
			barList['fee'].push(data[key].total_fee);
			barList['power'].push(data[key].total_power);
			barList['xList'].push(data[key].month);
		}
		myChart.chargeBar.chart.setOption({
			title:{
				text:'营收概览',
			},
			tooltip : {
		        trigger: 'axis'
		    },	
			noDataLoadingOption:{
				text:'暂无数据',
				effect:'bubble',
				textStyle:{
					fontSize:16,
					fontWeight:'bold',
					color:'#000000'
				}	
			},	
			legend: {
		        orient : 'horizontal',
		        x : 'center',
		        y : 'top',
		        data:['总收入','总电量']
		    },
		    xAxis : [{
	            type : 'category',
	            data : barList['xList']
		    }],
		     yAxis : [{
		        type : 'value'
		    }],
			series : [
				{
					name:'总收入',
					type:'bar',
					data:barList['fee']
				},
				{
					name:'总电量',
					type:'bar',
					data:barList['power']
				}
			]
		});

	},
	translateDraw:function(data){//月度时长 月度次数数据转换
		var xList = [] , countList = [],timeList = [];
		for(var key in data){
			xList.push(data[key].month);
			countList.push(parseInt(data[key].count));//次数
			timeList.push(parseInt(data[key].total_charge_time));//时长
		}
		thisFun.draw_maintenLine(countList,xList);
		thisFun.draw_countLine(timeList,xList);
	},
	draw_maintenLine:function(timeList,xList){
		if (myChart.maintenLine.chart && myChart.maintenLine.chart.dispose) {
			myChart.maintenLine.chart.hideLoading();
			myChart.maintenLine.chart.dispose();
			myChart.maintenLine.chart = echart.init(myChart.maintenLine.DOM);
		}		
		var chartoptions = {
			title:{
				text:'月度时长概览',
			},
			tooltip : {
		        trigger: 'axis'
		    },	
			noDataLoadingOption:{
				text:'暂无数据',
				effect:'bubble',
				textStyle:{
					fontSize:16,
					fontWeight:'bold',
					color:'#000000'
				}	
			},	
			legend: {
		        orient : 'horizontal',
		        x : 'center',
		        y : 'top',
		        data:['月度时长']
		    },
		    xAxis : [{
	            type : 'category',
	            data : xList
		    }],
		     yAxis : [{
		        type : 'value'
		    }],
			series : [
				{
					name:'月度时长',
					type:'line',
					data:timeList
				},
			]
		}
		if(xList.length){
			chartoptions.series[0].markPoint = {
                data : [
                    {type : 'max', name: '最大值'},
            		{type : 'min', name: '最小值'}
                ]
            };
            chartoptions.series[0].markPoint = {
                data : [
                    {type : 'average', name: '平均值'}
                ]
            };

		}
		myChart.maintenLine.chart.setOption(chartoptions);
	},
	draw_countLine:function(countList,xList){
		if (myChart.countLine.chart && myChart.countLine.chart.dispose) {
			myChart.countLine.chart.hideLoading();
			myChart.countLine.chart.dispose();
			myChart.countLine.chart = echart.init(myChart.countLine.DOM);
		}
		var chartoptions = {
			title:{
				text:'月度次数概览',
			},
			tooltip : {
		        trigger: 'axis'
		    },	
			noDataLoadingOption:{
				text:'暂无数据',
				effect:'bubble',
				textStyle:{
					fontSize:16,
					fontWeight:'bold',
					color:'#000000'
				}	
			},	
			legend: {
		        orient : 'horizontal',
		        x : 'center',
		        y : 'top',
		        data:['月度次数']
		    },
		    xAxis : [{
	            type : 'category',
	            data : xList
		    }],
		     yAxis : [{
		        type : 'value'
		    }],
			series : [
				{
					name:'月度次数',
					type:'line',
					data:countList
				},
			]
		}
		if(countList.length){
			chartoptions.series[0].markPoint = {
                data : [
                    {type : 'max', name: '最大值'},
            		{type : 'min', name: '最小值'}
                ]
            };
            chartoptions.series[0].markPoint = {
                data : [
                    {type : 'average', name: '平均值'}
                ]
            };

		}
		myChart.countLine.chart.setOption(chartoptions);
	}
}

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