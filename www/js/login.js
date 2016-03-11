$(function(){
    ($.cookie('re_userName') && $('#user_name').val($.cookie('re_userName')) && $("#pwd").focus() && $("#remember").attr('checked',true)) || $('#user_name').focus();
	$('#loginForm').bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            username: {//用户名
                validators: {
                    notEmpty: {
                        message: '请输入用户名'
                    },
                    regexp: {
                        regexp: /^([A-Za-z][a-zA-Z0-9_-]{3,15})|(0?(13|15|17|18|14)[0-9]{9})$/,
                        message: '请输入正确的用户名'
                    }
                }
            },
            pwd: {
                validators: {
                    notEmpty: {
                        message: '请输入密码'
                    },
                    regexp: {
                        regexp: /^([\w]|[-`=;\',.\/\~\!@#$%^&*()_+|{}:"<>?]){6,20}$/,
                        message: '请输入6-20位的密码'
                    }
                }
            }
        }
    }).on('success.form.bv',function(e){
        e.preventDefault();
        var submitObj = {},pwd = $('#pwd').val();
        submitObj['user_name'] = $("#user_name").val();
        gs.func.callCgi1(gs.cgi.web_user_login1,submitObj,function(json){//login1
            $("[type=submit]").attr("disabled",false);
            if(json.ret == 0){
                //=先Base64.parse 后 Utf8.stringfy 
                //var aesText = CryptoJS.enc.Base64.parse(json.data.login_key).toString(CryptoJS.enc.Utf8);
                var aesText = json.data.login_key;
                var aesKey = CryptoJS.enc.Utf8.parse(CryptoJS.SHA256(pwd).toString().slice(-32));//加密  解密前需要UTF8编码
                var cfg = {'mode':CryptoJS.mode.ECB,'padding':CryptoJS.pad.Pkcs7}
                var plainText = CryptoJS.AES.decrypt(aesText,aesKey,cfg).toString(CryptoJS.enc.Utf8);
                //解密的字符串BSASE64
                var plainBase64= CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(plainText));
                submitObj['key'] = plainBase64;
                gs.func.callCgi1(gs.cgi.web_user_login2,submitObj,function(json){//login2
                    //console.log(json); 
                    if(json.ret == 0 && json.data.token){
                        var baseInfo = {
                            user_name : $("#user_name").val(),
                            token : json.data.token
                        };
                        save_user_type(baseInfo);
                        layer.msg('登录成功,跳转中...',{icon: 1,offset:'30px'});
                        //保存cookie 记住用户名 设定时间的为持久cookie 不设置则关闭浏览器就删除 1表示1天
                        $("#remember")[0].checked && $.cookie("re_userName",$("#user_name").val(), { expires: 7 });
                        !$("#remember")[0].checked && $.cookie("re_userName",'');
                        var cookieTime = new Date();
                        cookieTime.setMinutes(+cookieTime.getMinutes()+10);//10分钟时间  总览页面 需要不停刷新 不停设置
                        $.cookie("sx_userInfo",JSON.stringify(baseInfo),{ expires: cookieTime });
                        var goUrl = $.getUrlParam('burl')?$.getUrlParam('burl'):'index.html';
                        goUrl = goUrl.indexOf('?') != -1 ? (goUrl+'&token='+ json.data.token) : (goUrl +'?token=' +json.data.token);
                            setTimeout(function(){
                            window.location.href = goUrl;
                        },1000);
                    }
                });
            }else{
                //异常问题 在common.js中处理
                //layer.msg(json.ret_msg,{icon: 5,offset:'30px'});
            }
            
        });
        return false;
    });
    function save_user_type(baseInfo){
        gs.func.callCgi(gs.cgi.web_user_query,baseInfo,function(json){
            console.log(json);
            var user_type_str = {1:'厂家管理员',2:'商户管理员',3:'商户用户'};
            var user_type = parseInt(json.data.user_type);
            $.cookie("sx_user_type",user_type_str[user_type]);
        })
    }
});