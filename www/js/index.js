
require.config({
	paths: {
		echarts: './js/plugins/echarts'
	}
});
var echart;
gs.myChart = myChart = {
	chargePile:{//充电桩 
		chart:'',
		DOM:document.getElementById('chargePile')
	},
	sevenLine:{
		chart:'',
		DOM:document.getElementById('lineChart')
	},
	survey:{//今日概况
		chart:'',
		DOM:document.getElementById('pie-echart1')
	}
}

$(document).ready(function () {
	require(
        [
            'echarts',
            'echarts/chart/pie',
			'echarts/chart/line',
			'echarts/chart/bar'
        ],
        function (ec) {
            echart = ec;
			myChart.chargePile.chart = ec.init(myChart.chargePile.DOM);//TOP充电桩
			myChart.survey.chart = ec.init(myChart.survey.DOM);//
			myChart.sevenLine.chart = ec.init(myChart.sevenLine.DOM);//充电概况趋势图
			drawFun.today_survey();
			var loadOption = {
				effect:'bubble',
				textStyle:{
					fontSize:16,
					fontWeight:'bold',
					color:'#000000'
				}
			}
			myChart.chargePile.chart.showLoading(loadOption);	
			myChart.sevenLine.chart.showLoading(loadOption);	
						
			mainFun.init();
			window.setInterval(function(){mainFun.init()},15000);
	
        }

    );
});
var mainFun = {
	init:function(page){
		//组装提交参数
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){
			subData[key] = userInfoList[key];
		}

		gs.func.callCgi(gs.cgi.web_overview,subData,function(json){
			// console.log(json);
			var ref_time = new Date(),ref_time_str = '';
			ref_time_str += ref_time.getHours() < 10?'0'+ref_time.getHours() : ref_time.getHours();
			ref_time_str += ':' + (ref_time.getMinutes() < 10?'0'+ref_time.getMinutes() : ref_time.getMinutes());
			ref_time_str += ':' + (ref_time.getSeconds() < 10?'0'+ref_time.getSeconds() : ref_time.getSeconds());
			ref_time_str += ' 更新';
			$("#ref_time").text(ref_time_str);
			var alarm_data = json.data.alarm_data;
			//写入cookies
			var baseData = {alarm_cnt:alarm_data.alarm_cnt};
			$.cookie("baseData",JSON.stringify(baseData));
			gs.func.loadBaseData(0);//type 是否加载用户名  当前只需要加载警告数据
			//今日数据显示
			var charge_data = json.data.charge_data;
			mainFun.formatter_num(charge_data.today_charge_times,'charge_times');
			mainFun.formatter_num(charge_data.today_charge_duration,'charge_duration');
			mainFun.formatter_num(charge_data.today_charge_kwh,'charge_kwh');
			mainFun.formatter_num(charge_data.today_charge_fee,'charge_fee');
			//statistics_data //充电桩TOP10数据
			var statistics_data = json.data.statistics_data;
			drawFun.dev_top(statistics_data);
			var seven_days_charge_data = json.data.seven_days_charge_data;
			drawFun.draw_seven_data(seven_days_charge_data);
			//今日概况
			var total_data = json.data.total_data;
			$('#today_used_num').text(total_data.today_used_num?total_data.today_used_num:0);
			$('#total_unused_num').text($.format_number(total_data.today_unused_num?total_data.today_unused_num:0));
			$('#total_num_dz').text($.format_number(total_data.total_num?total_data.total_num:0)).attr('title',total_data.total_num);//整体趋势总充电桩
			$('#total_kwh').text($.format_number(total_data.total_kwh?total_data.total_kwh:0)).attr('title',total_data.total_kwh);//整体趋势总充电量
			$('#total_fee').text($.format_number(total_data.total_fee?total_data.total_fee:0)).attr('title',total_data.total_fee);//整体趋势总收入
			drawFun.today_survey(total_data);
			
		});	
	},
	formatter_num:function(data,id){
		data || (data = 0);//空值处理
		var $id = $("#"+id),$num_text = $("#"+id +" .num_text");
		switch(id){
			case "charge_times": //充电次数
				$num_text.width($id.width() - 16).text($.format_number(data)).attr("title",$.format_number(data));
				$id.html($num_text).prepend('<small>次</small>');
				break;
			case "charge_duration"://充电时长
				$num_text.width($id.width() - 32).text($.format_number(data)).attr("title",$.format_number(data));
				$id.html($num_text).prepend('<small>小时</small>');
				break;
			case "charge_kwh"://充电电量
				var dataObj = {1:{text:'度',len:16},2:{text:'万度',len:32}},data_len,data_text;
				data_len = data/10000 >= 1?dataObj[2].len : dataObj[1].len;
				data_text = data/10000 >= 1?dataObj[2].text : dataObj[1].text;
				data = data/10000 >= 1?(data/10000).toFixed(2) : data;
				$num_text.width($id.width() - data_len).text(data).attr("title",data);
				$id.html($num_text).prepend('<small>'+ data_text +'</small>');
				break;
			case "charge_fee"://充电收入
				var dataObj = {1:{text:'元',len:16},2:{text:'万元',len:32}},data_len,data_text;
				data_len = data/10000 >= 1?dataObj[2].len : dataObj[1].len;
				data_text = data/10000 >= 1?dataObj[2].text : dataObj[1].text;
				data = data/10000 >= 1?(data/10000).toFixed(2) : data;
				$num_text.width($id.width() - data_len).text(data).attr("title",data);
				$id.html($num_text).prepend('<small>'+ data_text +'</small>');
				break;
		}
	}
}
var drawFun = {//绘图
	dev_top:function(list){//TOP10图
		if (myChart.chargePile.chart && myChart.chargePile.chart.dispose) {
			myChart.chargePile.chart.hideLoading();
			myChart.chargePile.chart.dispose();
			myChart.chargePile.chart = echart.init(myChart.chargePile.DOM);
		}
		var xAxis_list = [],series_list = [];
		for(var	key in list){
			xAxis_list.push(list[key].pile_name);//X轴只显示充电桩名称
			series_list.push({
				value:list[key].charge_kwh,
				pile_name:list[key].pile_name,
				station:list[key].station_name,
				dev_number:list[key].pile_id,//pile_id 即为电转编号
			});	
		}
		myChart.chargePile.chart.setOption({
			title : {
				text: 'TOP10充电桩'
			},
			
			tooltip : {
				trigger: 'axis',
				axisPointer : {            // 坐标轴指示器，坐标轴触发有效
		            type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
		        },
				formatter:function(a){
					console.log(a);
					var param = '充电站：'+ a[0]["3"].station +'<br>'
								+ '充电桩：'+a[0]["3"].pile_name + '[ ' + a[0]["3"].dev_number +' ]<br>'
								+a[0]["0"]+'：'+$.format_number(a[0]["2"])+' 度';
					return param;
						
				}
			},
			toolbox: {
				show : true,
				feature : {
					dataView : {show: true, readOnly: true},
					saveAsImage : {show: true}
				}
			},
			xAxis : [
				{
					type : 'category',
					data : xAxis_list
				}
			],
			yAxis : [
				{
					type : 'value'
				}
			],
			series : [
				{
					name:'充电量',
					type:'bar',
					itemStyle: {        // 系列级个性化样式，纵向渐变填充
						normal: {
							color : (function (){
								var zrColor = require('zrender/tool/color');
								return zrColor.getLinearGradient(
									0, 400, 0, 300,
									[[1, '#23c6c8']]
								)
							})()
						}
					},
					data:series_list,
				}
			]
		});
	},
	draw_seven_data:function(sevenData){//趋势图
		if (myChart.sevenLine.chart && myChart.sevenLine.chart.dispose) {
			myChart.sevenLine.chart.hideLoading();
			myChart.sevenLine.chart.dispose();
			myChart.sevenLine.chart = echart.init(myChart.sevenLine.DOM);
		}
		var xList = [],yList_fee = [],yList_power = [],yList_num = [];
		for(var key in sevenData){
			xList.push(sevenData[key].time);
			yList_fee.push(sevenData[key].fee);//充电费用
			yList_power.push(sevenData[key].charge_power);//充电电量
		}
		myChart.sevenLine.chart.setOption({
			title : {
				text: '趋势图'
			},
			tooltip : {
				trigger: 'axis',
				formatter:function(a){
					//console.log(a);return false;
					var param = a[0][1] +'<br>'
								+ a[0][0] + '：' + a[0][2] +'元 <br>'
								+ a[1][0] + '：' + a[1][2] +'度 <br>'
					return param;
						
				}
			},
			legend: {
				//show:false,
				data:['充电电量','充电收入']
			},
			toolbox: {
				show : true,
				feature : {
					dataView : {show: true, readOnly: true},
					saveAsImage : {show: true}
				}
			},
			//calculable : true,
			xAxis : [
				{
					type : 'category',
					boundaryGap : false,
					data : xList
				},
			],
			yAxis : [
				{
					name:'充电电量',
					type : 'value'
				},{
					name:'充电收入',
					type : 'value',
					splitLine:{
						show:true,

					}
				}
			],
			series : [
				{
					name:'充电电量',
					type:'line',
					smooth:true,
					itemStyle: {normal: {areaStyle: {type: 'default'}}},
					data:yList_power
				},
				{
					name:'充电收入',
					type:'line',
					yAxisIndex:1,
					smooth:true,
					itemStyle: {normal: {areaStyle: {type: 'default'}}},
					data:yList_fee
				}
			]
		});
	},
	today_survey :function(surveyData){//今日概况
		if (myChart.survey.chart && myChart.survey.chart.dispose) {
			myChart.survey.chart.hideLoading();
			myChart.survey.chart.dispose();
			myChart.survey.chart = echart.init(myChart.survey.DOM);
		}
		myChart.survey.chart.setOption({
			tooltip : {
				trigger: 'item',
				show: true,
				formatter:function(a){
					return $.format_number(a['2']);
				}
			},			
			series : [
				{
					name:'概况',
					type:'pie',
					radius : '55%',
					center: ['50%', '50%'],
					itemStyle : {
						normal : {
							label : {
								show : false
							},
							labelLine : {
								show : false
							}
						}
					},
					data:[
						{value:surveyData && surveyData.today_used_num?surveyData.today_used_num:0, name:''},
						{value:surveyData && surveyData.today_unused_num?surveyData.today_unused_num:-1, name:''}
					]
				}
			]
		});	
	},
}
	