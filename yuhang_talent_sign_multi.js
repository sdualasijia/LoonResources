/*
[Script]
# ==================================
# 余杭人才码签到 (多账户版)
# ==================================
cron "1 0 * * *" script-path=https://raw.githubusercontent.com/sdualasijia/LoonResources/main/yuhang_talent_sign_multi.js, timeout=120, tag=余杭人才码签到
*/

// --- 配置区域 ---
// oldTokens 通过 BoxJs 写入 Loon 持久化存储，多个 token 使用 @ 分隔
const TOKEN_STORE_KEY = "yuhang_talent_old_tokens";
const oldTokens = ($persistentStore.read(TOKEN_STORE_KEY) || "")
    .split("@")
    .map(token => token.trim())
    .filter(Boolean);
const names = [
    "liuyang",
    "wangchangyuan"
];
// ----------------


(async () => {
    if (oldTokens.length === 0) {
        console.log("❌ 未配置 token，请在 BoxJs 中填写 oldTokens。");
        $notification.post("余杭人才码签到", "配置错误", "请在 BoxJs 中配置 oldTokens。");
        $done();
        return;
    }

    console.log(`🚀 检测到 ${oldTokens.length} 个账户，开始执行签到任务...`);
    let summaryMessages = [];
    let flag = true;
    let info = '';
    for (let i = 0; i < oldTokens.length; i++) {
        const currentToken = oldTokens[i];
        const accountName = names[i] || `账户${i + 1}`;
        
        console.log(`\n--- 开始为账户 ${accountName} 签到 ---`);
        try {
            console.log(`[${accountName}] 正在获取 accessToken...`);
            const accessToken = await getAccessToken(currentToken);
            
            console.log(`[${accountName}] 成功获取 accessToken...✅`);
            console.log(`[${accountName}] 查看是否已经签到...`);
            const signFlag = await getSignFlag(accessToken);
            if (signFlag === '2') { // 已签到
                console.log(`[${accountName}] 今日已签到，无需重复签到...✅`);
                summaryMessages.push(`[${accountName}]: 今日已签到...✅`);
                continue;
            } else {
                console.log(`ℹ️ [${accountName}] 今日尚未签到，继续执行签到操作...`);
            }
            console.log(`[${accountName}] 正在执行签到...`);
            const signResult = await doSign(accessToken);
            summaryMessages.push(`[${accountName}]: ${signResult}`);
        } catch (error) {
            flag = false;
            console.log(`❌ [${accountName}] 签到失败: ${error.message}`);
            summaryMessages.push(`[${accountName}]: 失败 ❌ (${error.message})`);
        }
    }
    if (flag) {
        console.log("\n🎉 所有账户签到任务执行完毕。");
        $notification.post(
            "✅ 余杭人才码签到完成", 
            `共处理 ${oldTokens.length} 个账户`,
            summaryMessages.join("\n")
        );
    } else {
        $notification.post(
            "❌ 余杭人才码签到失败", 
            `共处理 ${oldTokens.length} 个账户`,
            summaryMessages.join("\n")
        );
    }
    $done();
})();

function getAccessToken(token) {
    const url = "https://open.iconntech.com/unifyUser/changeToken";
    const headers = {
        "Host": "open.iconntech.com",
        "Accept": "*/*",
        "Sec-Fetch-Site": "cross-site",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Mode": "cors",
        "Content-Type": "application/json",
        "Origin": "https://yhrcm.zzb.hzyuhang.cn",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 smkH5ContainerSDK/2.1.2 smkVersion/6.7.18",
        "Referer": "https://yhrcm.zzb.hzyuhang.cn:9443/",
        "Sec-Fetch-Dest": "empty"
    };
    const body = {
        "appId": "541782953399693312",
        "token": token
    };

    return new Promise((resolve, reject) => {
        $httpClient.post({ url, headers, body: JSON.stringify(body) }, (error, response, data) => {
            if (error) return reject(new Error(`获取 token 请求失败: ${error}`));
            if (response.status === 200) {
                try {
                    const jsonData = JSON.parse(data);
                    // console.log(`changeToken接口返回数据: ${data}`);
                    if (jsonData.respCode === '00' && jsonData.data) {
                        resolve(jsonData.data);
                    } else {
                        reject(new Error(`接口返回错误: ${jsonData.message || data}`));
                    }
                } catch (e) {
                    reject(new Error(`解析 token 响应失败: ${e.message}`));
                }
            } else {
                reject(new Error(`响应状态码异常: ${response.status}`));
            }
        });
    });
}

function doSign(accessToken) {
    const url = "https://yhrcm.zzb.hzyuhang.cn/smkbusper/talent/1.0.0/sign";
    const headers = {
        "Host": "yhrcm.zzb.hzyuhang.cn",
        "Accept": "*/*",
        "sendChl": "hzsmk.h5",
        "Sec-Fetch-Site": "same-origin",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Sec-Fetch-Mode": "cors",
        "Content-Type": "application/json;charset=UTF-8",
        "Origin": "https://yhrcm.zzb.hzyuhang.cn",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 smkH5ContainerSDK/2.1.2 smkVersion/6.7.18",
        "sendClient": "hellohzsmk",
        "Referer": "https://yhrcm.zzb.hzyuhang.cn/yhtalentcard/yhtalentcard/index.html",
        "Sec-Fetch-Dest": "empty"
    };
    const body = { "accessToken": accessToken };

    return new Promise((resolve, reject) => {
        $httpClient.post({ url, headers, body: JSON.stringify(body) }, (error, response, data) => {
            if (error) return reject(new Error(`请求失败: ${error}`));
            
            try {
                const jsonData = JSON.parse(data);
                const message = jsonData.msg;
                // console.log(`sign接口返回数据: ${data}`);
                if (jsonData.code === 'PY0000') {
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

function getSignFlag(accessToken) {
    const url = "https://yhrcm.zzb.hzyuhang.cn/smkbusper/talent/1.0.0/getSignFlag";
    const headers = {
        "Host": "yhrcm.zzb.hzyuhang.cn",
        "Accept": "*/*",
        "sendChl": "hzsmk.h5",
        "Sec-Fetch-Site": "same-origin",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Mode": "cors",
        "Content-Type": "application/json;charset=UTF-8",
        "Origin": "https://yhrcm.zzb.hzyuhang.cn",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 smkH5ContainerSDK/2.1.2 smkVersion/6.7.18",
        "sendClient": "hellohzsmk",
        "Referer": "https://yhrcm.zzb.hzyuhang.cn/yhtalentcard/yhtalentcard/index.html",
        "Sec-Fetch-Dest": "empty"
    };
    const body = { "accessToken": accessToken };

    return new Promise((resolve, reject) => {
        $httpClient.post({ url, headers, body: JSON.stringify(body) }, (error, response, data) => {
            if (error) return reject(new Error(`请求失败: ${error}`));
            
            try {
                const jsonData = JSON.parse(data);
                const message = jsonData.msg;
                // console.log(`getSignFlag接口返回数据: ${data}`);
                if (jsonData.code === 'PY0000') {
                    const signFlag = jsonData.response.signFlag;
                    resolve(signFlag);
                } else {
                    reject(new Error(message));
                }
            } catch (e) {
                reject(new Error(`解析响应失败: ${e.message}`));
            }
        });
    });
}
