$(function(){
	thisFun.init();
})
var thisFun = {
	user_type_enum:{1:'厂家管理员',2:'商户管理员',3:'商户用户'},
	init:function(){
		var userInfoList = gs.func.getUserData(),subData = {};
		for(var key in userInfoList){//用户名 商户名 token数据加载
			subData[key] = userInfoList[key];
		}
		gs.func.callCgi(gs.cgi.web_user_query,subData,function(json){
			console.log(json);
			var user_type = parseInt(json.data.user_type),
				auth_data = json.data.auth_data,//权限列表
				user_list = json.data.user_list;//用户列表 管理员才有
			$("#user_cur_type").text(thisFun.user_type_enum[user_type]);
			thisFun.show_user_auth(auth_data);
			thisFun.show_user_list(user_list);
		})
	},
	show_user_auth:function(auth_data){
		$("#table_auth").dataTable({
			data:auth_data,
        	columns:[
        		{title:'',className:"text-center", render:function(data,type,row){
        			return '<input class="disabled" disabled="disabled" type="checkbox" '+ (row.auth_flag == 1?'checked':'') +' name="auth_check"/>'}
        		},
        		{title:'权限名称',data:'auth_desc'},
        		{title:'权限描述',data:'auth_desc'}
        	],
        	'dom':'t',
        	'sort':false,
            'bDestroy': true,
            'bLengthChange': true,
		});
	},
	show_user_list:function(user_list){
		if(!user_list.length) return false;
		$("#user_list").show();
		var option = {
			data:user_list,
			"fnInitComplete": function() {
            	this.fnAdjustColumnSizing(true);//自动列宽
            	$("#table_user_wrapper .newBtn").html('<button onclick="thisFun.addNewUser()" class="btn btn-success" style="margin-top: 2px;">新增</button>');
            },
        	columns:[
        		{'title':'用户名','className':"text-center",'data':'user_name'},
        		{'title':'用户权限','data':'user_level',render:function(data,type,row){
        			return thisFun.user_type_enum[row.user_level]
        		}},
        		{'title':'登录IP','data':'client_ip'},
        		{'title':'用户帐号建立时间','data':'create_time'},
        		{'title':'最后一次访问时间','data':'login_time'},
        		{'title':'最后更改时间','data':'last_modify_time'},
        		{'title':'操作','className':"text-center",render:function(data,type,row){
        			var btnHtml = '';
        			btnHtml += '<div class="btn-group"><button onclick="thisFun.deleteUser(\''+row.user_name+'\')" class="btn btn-danger">删除</button></div>';
        			return btnHtml;
        		}}
        	],
        	'sort':false,
            'bDestroy': true,
            'bLengthChange': true,
		}
		option['dom'] = user_list.length > 10?'T<"clear"><"col-md-6"l><"col-md-6"<"pull-right newBtn"> fr>t<"pull-left"i>p':'<"col-md-6"><"col-md-6"<"pull-right newBtn">>t';
		var user_table = $("#table_user").dataTable(option);
		
	},
	addNewUser:function(){
		var content_html = '';
		content_html += '<div class="form-group clearfix m-t-20">'
        content_html += '<label class="my_label">用户名：</label>'
        content_html += '<div class="my_input"><input type="text" name="user_name" id="new_user_name" class="form-control"/>';
        content_html += '<span class="text-danger" style="height:22px;line-height:22px;min-width:20px;">&nbsp;</span></div></div>';
        content_html += '<div class="form-group clearfix">'
        content_html += '<label class="my_label">密&nbsp;&nbsp;码：</label>'
        content_html += '<div class="my_input"><input type="password" name="user_pwd" id="new_user_pwd" class="form-control"/>';
        content_html += '<span class="text-danger" style="height:22px;line-height:22px;min-width:20px;">&nbsp;</span></div></div>';
        layer.open({
			type:1,
			scrollbar :false,
			offset:'50px',
			title: '添加用户',
			area:['450px','250px'],
			content:content_html,
			btn:['提交','取消'],
			success:function(layero,index){
				$("#new_user_name").blur(function(){
					if(!this.value){
						$(this).parent().find('span').text('用户名不能为空');
					}else if(!/^([A-Za-z][a-zA-Z0-9_-]{3,15})|(0?(13|15|17|18|14)[0-9]{9})$/.test(this.value)){
						$(this).parent().find('span').text('请输入正确的用户名');
					}
				}).focus(function(){
					$(this).parent().find('span').text('').html('&nbsp;');
				});
				$("#new_user_pwd").blur(function(){
					if(!this.value){
						$(this).parent().find('span').text('密码不能为空');
					}else if(!/^([\w]|[-`=;\',.\/\~\!@#$%^&*()_+|{}:"<>?]){6,20}$/.test(this.value)){
						$(this).parent().find('span').text('请输入正确的密码');
					}
				}).focus(function(){
					$(this).parent().find('span').text('').html('&nbsp;');
				});
			},
			yes:function(index){
				var user_name = $("#new_user_name").val(),pwd = $("#new_user_pwd").val(),alert_text = '';
				var user_name_reg = /^([A-Za-z][a-zA-Z0-9_-]{3,15})|(0?(13|15|17|18|14)[0-9]{9})$/;
				var user_pwd_reg = /^([\w]|[-`=;\',.\/\~\!@#$%^&*()_+|{}:"<>?]){6,20}$/;
				if(user_name && user_name_reg.test(user_name) && pwd && user_pwd_reg.test(pwd)){
					
				}else{
					$("#new_user_pwd,#new_user_name").trigger('blur')
					layer.alert('请按要求输入用户名和密码');
					return false;
				}
				var sha256_pwd = CryptoJS.SHA256(pwd).toString(),rsa = new RSAKey(),N32,N,D,E = '10001';//E公指数
		        rsa.generate(128,E);//随机的32字节字符串
		        N32 = rsa.n.toString(16);//随机的32字节字符串
		        rsa.setPublic('A06F58A80AE6D6CCD98325FB71A14E9A9AEC30D5CA437261012858ABE0D0E1584FDD80E0057D3361F6355760EFD18C86AB1900FA3A11DA7CF8F3524C3DB16622AA7BFFBF6D21A8791AF2264B7C5B78E157AFD41E9005708B97ADF5B76DD1458536683A57429B38478BC8B02CE8C4305C2F042A933248DFB6C1340D402BBA8005', '10001');
		        //rsa公钥加密(32个字节的随机字符串+sha256(用户输入的明文密码))
		        var res = rsa.encrypt(N32 + sha256_pwd);
		        var base64=hex2b64(res);
		        var userInfoList = gs.func.getUserData(),subData = {};
				for(var key in userInfoList){//用户名 商户名 token数据加载
					subData[key] = userInfoList[key];
				}
		        subData['new_user'] = user_name;
		        subData['key'] = base64;
		        gs.func.callCgi1(gs.cgi.web_user_register,subData,function(json){
		            console.log(json);
		            layer.alert('添加成功！',function(index){
		            	layer.closeAll();
		            	thisFun.init();
		            });
		        });
			}
		});
	},
	changePwd:function(){
		var content_html = '';content_html += '<div class="form-group clearfix m-t-20">'
        content_html += '<label class="my_label">旧密码：</label>'
        content_html += '<div class="my_input"><input type="password" name="user_pwd" id="old_user_pwd" class="form-control"/>';
        content_html += '<span class="text-danger" style="height:22px;line-height:22px;min-width:20px;">&nbsp;</span></div></div>';
        content_html += '<div class="form-group clearfix">'
        content_html += '<label class="my_label">新密码：</label>'
        content_html += '<div class="my_input"><input type="password" name="user_pwd" id="new_user_pwd" class="form-control"/>';
        content_html += '<span class="text-danger" style="height:22px;line-height:22px;min-width:20px;">&nbsp;</span></div></div>';
        content_html += '<div class="form-group clearfix">'
        content_html += '<label class="my_label">确认新密码：</label>'
        content_html += '<div class="my_input"><input type="password" name="user_pwd" id="re_new_user_pwd" class="form-control"/>';
        content_html += '<span class="text-danger" style="height:22px;line-height:22px;min-width:20px;">&nbsp;</span></div></div>';
        layer.open({
			type:1,
			scrollbar :false,
			offset:'50px',
			title: '修改密码',
			area:['480px','340px'],
			content:content_html,
			btn:['提交','取消'],
			success:function(layero,index){
				$("#old_user_pwd").blur(function(){
					if(!this.value){
						$(this).parent().find('span').text('请输入旧密码');
					}else if(!/^([\w]|[-`=;\',.\/\~\!@#$%^&*()_+|{}:"<>?]){6,20}$/.test(this.value)){
						$(this).parent().find('span').text('请输入6-20位正确的旧密码');
					}
				}).focus(function(){
					$(this).parent().find('span').text('').html('&nbsp;');
				});
				$("#new_user_pwd").blur(function(){
					if(!this.value){
						$(this).parent().find('span').text('请输入新密码');
					}else if(!/^([\w]|[-`=;\',.\/\~\!@#$%^&*()_+|{}:"<>?]){6,20}$/.test(this.value)){
						$(this).parent().find('span').text('请输入6-20位正确的旧密码');
					}else{
						$("#re_new_user_pwd").trigger('blur');
					}
				}).focus(function(){
					$(this).parent().find('span').text('').html('&nbsp;');
				});
				$("#re_new_user_pwd").blur(function(){
					if(!this.value){
						$(this).parent().find('span').text('请输入确认新密码');
					}else if(!/^([\w]|[-`=;\',.\/\~\!@#$%^&*()_+|{}:"<>?]){6,20}$/.test(this.value)){
						$(this).parent().find('span').text('请输入6-20位正确的旧密码');
					}else{
						var new_pwd = $.trim($("#new_user_pwd").val());
						console.log(new_pwd,this.value);
						if(new_pwd == this.value){
							$(this).parent().find('span').text('').html('&nbsp;');
							$("#new_user_pwd").parent().find('span').text('').html('&nbsp;');
						}else if(new_pwd){
							$(this).parent().find('span').text('').html('两次新密码输入不相同');
						}
					}
				}).focus(function(){
					$(this).parent().find('span').text('').html('&nbsp;');
				});
			},
			yes:function(index,layero){
				var old_pwd = $.trim($("#old_user_pwd").val()),
					new_pwd = $.trim($("#new_user_pwd").val()),
					re_new_pwd = $.trim($("#re_new_user_pwd").val()),
					reg_rule = /^([\w]|[-`=;\',.\/\~\!@#$%^&*()_+|{}:"<>?]){6,20}$/;
				if(reg_rule.test(old_pwd) && reg_rule.test(new_pwd) && reg_rule.test(re_new_pwd) && new_pwd == re_new_pwd){
					var old_sha256_pwd = CryptoJS.SHA256(old_pwd).toString(),
						sha256_pwd = CryptoJS.SHA256(new_pwd).toString(),
						rsa = new RSAKey(),N32,N,D,E = '10001';//E公指数
			        rsa.generate(128,E);//随机的32字节字符串
			        N32 = rsa.n.toString(16);//随机的32字节字符串
			        rsa.setPublic('A06F58A80AE6D6CCD98325FB71A14E9A9AEC30D5CA437261012858ABE0D0E1584FDD80E0057D3361F6355760EFD18C86AB1900FA3A11DA7CF8F3524C3DB16622AA7BFFBF6D21A8791AF2264B7C5B78E157AFD41E9005708B97ADF5B76DD1458536683A57429B38478BC8B02CE8C4305C2F042A933248DFB6C1340D402BBA8005', '10001');
			        //rsa公钥加密(32个字节的随机字符串+sha256(用户输入的明文密码))
			        var res = rsa.encrypt(N32 + sha256_pwd);
			        var base64=hex2b64(res);
					var userInfoList = gs.func.getUserData(),subData = {};
					for(var key in userInfoList){//用户名 token数据加载
						subData[key] = userInfoList[key];
					}
			        subData['old_pass'] = old_sha256_pwd;
			        subData['key'] = base64;
					gs.func.callCgi1(gs.cgi.web_user_repass,subData,function(json){
			            layer.alert('密码修改成功!',function(index){
			            	layer.close(index);
			            	$.cookie("sx_userInfo",null);
			            	var location = window.location;
			            	window.location.href = 'login.html?burl='+location.origin + location.pathname;//刷新
			            });
			            
			        });
				}else{
					$("#old_user_pwd,#new_user_pwd,#re_new_user_pwd").trigger('blur');
				}
			}
		});
	},
	deleteUser:function(user_name){
		layer.confirm('您确定要删除'+user_name+'用户吗？',function(index){
			var userInfoList = gs.func.getUserData(),subData = {};
			for(var key in userInfoList){//用户名 商户名 token数据加载
				subData[key] = userInfoList[key];
			}
			subData['del_user'] = user_name;
			gs.func.callCgi(gs.cgi.web_user_del,subData,function(json){
				console.log(json);
				layer.alert('删除成功！',function(index){
	            	layer.closeAll();
	            	thisFun.init();
	            });
			});
		});
		
	}
}