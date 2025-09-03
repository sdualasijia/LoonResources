/*
[Script]
# ==================================
# 余杭人才码签到 (多账户版)
# ==================================
cron "10 7 * * *" script-path=https://raw.githubusercontent.com/username/repo/main/yuhang_talent_sign_multi.js, timeout=120, tag=余杭人才码签到

[MITM]
hostname = open.iconntech.com, yhrcm.zzb.hzyuhang.cn
*/

// --- 配置区域 ---
// 请在这里填入你所有需要签到的 token 列表
// 每个 token 用双引号括起来，并用逗号隔开
const oldTokens = [
    "c03c0f4908884fd1a1bc630bdd5a5280", // 账户1的token (示例)
    "another_token_for_account_2_xxxx"   // 账户2的token (请替换)
];
// ----------------

const $ = new $loon.API();

(async () => {
    if (!oldTokens || oldTokens.length === 0 || oldTokens[0].includes("c03c0f4908884fd1a1bc630bdd5a5280")) {
        console.log("❌ 未配置或使用了示例 token，请在脚本中填写你自己的 token 列表。");
        $.notification.post("余杭人才码签到", "配置错误", "请编辑脚本并填写你的 token 列表。");
        $.done();
        return;
    }

    console.log(`🚀 检测到 ${oldTokens.length} 个账户，开始执行签到任务...`);
    let summaryMessages = [];

    for (let i = 0; i < oldTokens.length; i++) {
        const currentToken = oldTokens[i];
        const accountNumber = i + 1;
        
        console.log(`\n--- 开始为账户 ${accountNumber} 签到 ---`);
        try {
            console.log(`[账户 ${accountNumber}] 正在获取 accessToken...`);
            const accessToken = await getAccessToken(currentToken);
            
            console.log(`[账户 ${accountNumber}] ✅ 成功获取 accessToken。`);
            console.log(`[账户 ${accountNumber}] 正在执行签到...`);
            const signResult = await doSign(accessToken);
            summaryMessages.push(`👤 账户 ${accountNumber}: ${signResult}`);
        } catch (error) {
            console.log(`❌ [账户 ${accountNumber}] 签到失败: ${error.message}`);
            summaryMessages.push(`👤 账户 ${accountNumber}: 失败 ❌ (${error.message})`);
        }
    }

    console.log("\n🎉 所有账户签到任务执行完毕。");
    $.notification.post(
        "余杭人才码签到完成", 
        `共处理 ${oldTokens.length} 个账户`,
        summaryMessages.join("\n")
    );

    $.done();
})();

function getAccessToken(token) {
    const url = "https://open.iconntech.com/unifyUser/changeToken";
    const headers = {
        "Host": "open.iconntech.com",
        "Accept": "*/*",
        "Sec-Fetch-Site": "cross-site",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Sec-Fetch-Mode": "cors",
        "Content-Type": "application/json",
        "Origin": "https://yhrcm.zzb.hzyuhang.cn:9443",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 smkH5ContainerSDK/2.1.2 smkVersion/6.7.6",
        "Referer": "https://yhrcm.zzb.hzyuhang.cn:9443/",
        "Sec-Fetch-Dest": "empty"
    };
    const body = {
        "appId": "541782953399693312",
        "token": token
    };

    return new Promise((resolve, reject) => {
        $.post({ url, headers, body: JSON.stringify(body) }, (error, response, data) => {
            if (error) return reject(new Error(`获取 token 请求失败: ${error}`));
            if (response.statusCode === 200) {
                try {
                    const jsonData = JSON.parse(data);
                    if (jsonData.code === '0' && jsonData.data) {
                        resolve(jsonData.data);
                    } else {
                        reject(new Error(`接口返回错误: ${jsonData.message || data}`));
                    }
                } catch (e) {
                    reject(new Error(`解析 token 响应失败: ${e.message}`));
                }
            } else {
                reject(new Error(`响应状态码异常: ${response.statusCode}`));
            }
        });
    });
}

function doSign(accessToken) {
    const url = "https://yhrcm.zzb.hzyuhang.cn:9443/smkbusper/talent/1.0.0/sign";
    const headers = {
        "Host": "yhrcm.zzb.hzyuhang.cn:9443",
        "Accept": "*/*",
        "sendChl": "hzsmk.h5",
        "Sec-Fetch-Site": "same-origin",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Sec-Fetch-Mode": "cors",
        "Content-Type": "application/json;charset=UTF-8",
        "Origin": "https://yhrcm.zzb.hzyuhang.cn:9443",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 smkH5ContainerSDK/2.1.2 smkVersion/6.7.6",
        "sendClient": "hellohzsmk",
        "Referer": "https://yhrcm.zzb.hzyuhang.cn:9443/yhtalentcard/yhtalentcard/index.html",
        "Sec-Fetch-Dest": "empty"
    };
    const body = { "accessToken": accessToken };

    return new Promise((resolve, reject) => {
        $.post({ url, headers, body: JSON.stringify(body) }, (error, response, data) => {
            if (error) return reject(new Error(`请求失败: ${error}`));
            
            try {
                const jsonData = JSON.parse(data);
                const message = jsonData.message || "未知响应";
                if (jsonData.code === '0' || message.includes("已签到")) {
                    resolve(message);
                } else {
                    reject(new Error(message));
                }
            } catch (e) {
                reject(new Error(`解析响应失败: ${e.message}`));
            }
        });
    });
}
