(function () {
  const group = "TG重连";
  const temporaryPolicy = "REJECT";

  function respond(status, message) {
    console.log(message);
    $notification.post("TG 重连", status === 200 ? "策略已重置" : "操作失败", message);
    $done({
      response: {
        status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "Connection": "close"
        },
        body: status === 200 ? "good" : message
      }
    });
  }

  if (typeof $request === "undefined" || $request.url !== "http://slightly.qx/kill" || $request.method !== "GET") {
    respond(400, "请通过 GET http://slightly.qx/kill 触发重连");
    return;
  }

  try {
    const config = JSON.parse($config.getConfig() || "{}");
    if (config.running_model !== 1) {
      respond(409, "请先将 Loon 切换到分流模式");
      return;
    }

    const originalPolicy = $config.getSelectedPolicy(group);
    if (!originalPolicy || originalPolicy === temporaryPolicy) {
      respond(409, "请先在 TG重连 策略组中选择代理策略；若正在重连，请等待完成");
      return;
    }

    if (!$config.setSelectPolicy(group, temporaryPolicy)) {
      respond(500, "无法临时切换策略，请检查 TG重连 策略组是否包含 REJECT");
      return;
    }

    setTimeout(function () {
      try {
        if (!$config.setSelectPolicy(group, originalPolicy) || $config.getSelectedPolicy(group) !== originalPolicy) {
          throw new Error("未能恢复原策略");
        }
        respond(200, "已恢复 TG重连 → " + originalPolicy);
      } catch (error) {
        respond(500, "恢复失败，请手动将 TG重连 切回 " + originalPolicy + "：" + error.message);
      }
    }, 150);
  } catch (error) {
    respond(500, "策略操作失败：" + error.message);
  }
})();
