package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC — 消息推送、日志、备份、开放接口、教育局对接、家校消息、勋章、排行榜、安全预警。
 */
@RestController
@RequestMapping("/api/pc/integration")
public class PcNotifyIntegrationController {

    @GetMapping("/message-push/demo")
    public R<Map<String, Object>> messagePush() {
        return demo("消息推送管理");
    }

    @GetMapping("/system-log/demo")
    public R<Map<String, Object>> systemLog() {
        return demo("系统日志");
    }

    @GetMapping("/backup/demo")
    public R<Map<String, Object>> backup() {
        return demo("数据备份");
    }

    @GetMapping("/openapi/demo")
    public R<Map<String, Object>> openApi() {
        return demo("接口配置");
    }

    @GetMapping("/bureau/demo")
    public R<Map<String, Object>> bureau() {
        return demo("教育局对接");
    }

    @GetMapping("/homeschool-msg/demo")
    public R<Map<String, Object>> homeschoolMsg() {
        return demo("家校消息管理");
    }

    @GetMapping("/medal/demo")
    public R<Map<String, Object>> medal() {
        return demo("勋章管理");
    }

    @GetMapping("/rank/demo")
    public R<Map<String, Object>> rank() {
        return demo("排行榜配置");
    }

    @GetMapping("/safety/demo")
    public R<Map<String, Object>> safety() {
        return demo("运动安全预警");
    }

    private static R<Map<String, Object>> demo(String page) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", page);
        return R.ok(m);
    }
}
