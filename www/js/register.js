$(function(){
	$('#registerForm').bootstrapValidator({
        message: 'This value is not valid',
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
                    stringLength: {
                        min: 4,
                        max: 30,
                        message: '请输入4-30位字符的用户名'
                    },
                    regexp: {
                        regexp: /^([A-Za-z][a-zA-Z0-9_-]{3,15})|(0?(13|15|17|18|14)[0-9]{9})$/,
                        message: '用户名只能由字母、数字和下划线组成'
                    }
                }
            },
            customer_name: {//商户名
                // message: '用户名只能由字母、数字和下划线组成',
                // container:'#customer_help_blok',
                validators: {
                    notEmpty: {
                        message: '请输入商户名'
                    },
                    stringLength: {
                        min: 2,
                        max: 30,
                        message: '请输入2-30位字符的商户名'
                    },
                    // regexp: {
                    //     //regexp: /^(?=[A-Za-z0-9_()（）\\-\\u4e00-\\u9fa5]*[\u4e00-\u9fa5][A-Za-z0-9_()（）\\-\\u4e00-\\u9fa5]*).{0,30}$/,
                    //     message: '商户名由中文字符和字母组成'
                    // }
                }
            },
            pwd: {//密码
                // message: '用户名只能由字母、数字和下划线组成',
                // container:'#customer_help_blok',
                validators: {
                    notEmpty: {
                        message: '请输入密码'
                    },
                    stringLength: {
                        min: 6,
                        max: 18,
                        message: '请输入6-18位字符的密码'
                    },
                    // regexp: {
                    //     regexp: /^[a-zA-Z0-9_]+$/,
                    //     message: '用户名只能由字母、数字和下划线组成'
                    // }
                }
            },
            re_pwd: {//确认密码
                // message: '用户名只能由字母、数字和下划线组成',
                // container:'#customer_help_blok',
                validators: {
                    notEmpty: {
                        message: '请输入确认密码'
                    },
                    stringLength: {
                        min: 6,
                        max: 30,
                        message: '请输入6-30位字符的确认密码'
                    },
                    // regexp: {
                    //     regexp: /^[a-zA-Z0-9_]+$/,
                    //     message: '用户名只能由字母、数字和下划线组成'
                    // },
                    identical:{
                        field:'pwd',
                        message:'密码不一致，请重新输入'
                    }
                }
            }
        }
    }).on('success.form.bv',function(e){
        var submitObj = {};
        var pwd = $("#pwd").val();
        var sha256_pwd = CryptoJS.SHA256(pwd).toString();
        var rsa = new RSAKey();
        var N32,N,D,E = '10001';//E公指数
        rsa.generate(128,E);//随机的32字节字符串
        N32 = rsa.n.toString(16);//随机的32字节字符串
        rsa.setPublic('A06F58A80AE6D6CCD98325FB71A14E9A9AEC30D5CA437261012858ABE0D0E1584FDD80E0057D3361F6355760EFD18C86AB1900FA3A11DA7CF8F3524C3DB16622AA7BFFBF6D21A8791AF2264B7C5B78E157AFD41E9005708B97ADF5B76DD1458536683A57429B38478BC8B02CE8C4305C2F042A933248DFB6C1340D402BBA8005', '10001');
        //rsa公钥加密(32个字节的随机字符串+sha256(用户输入的明文密码))
        var res = rsa.encrypt(N32 + sha256_pwd);
        var base64=hex2b64(res);
        submitObj['user_name'] = $("#user_name").val();
        submitObj['customer_name'] = $("#customer_name").val();
        submitObj['key'] = base64;
        gs.func.callCgi1(gs.cgi.web_user_register,submitObj,function(json){
            console.log(json);
            if(json.ret == 0){
                var baseInfo = {
                    user_name : $("#user_name").val(),
                    customer_name : $("#customer_name").val(),
                    token : json.data.token[1]
                };
                layer.msg('注册成功,跳转中...',{icon: 1,offset:'30px'});
                $.cookie("sx_userInfo",JSON.stringify(baseInfo)); 
                setTimeout(function(){
                    window.location.href = 'index.html?token='+ json.data.token[1];
                },1000);
            }else{// if (json.ret == -4) 
                layer.msg(json.ret_msg,{icon: 5,offset:'30px'});
            };
            $("#submitBt").attr("disabled",false);
        });
        return false;
    });
});