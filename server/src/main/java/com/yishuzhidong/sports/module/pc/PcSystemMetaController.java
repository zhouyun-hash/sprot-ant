package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC — 系统设置、版本、帮助中心、操作日志；数据同步日志。
 */
@RestController
@RequestMapping("/api/pc/system")
public class PcSystemMetaController {

    @GetMapping("/settings/demo")
    public R<Map<String, Object>> settings() {
        return demo("系统设置");
    }

    @GetMapping("/version/demo")
    public R<Map<String, Object>> version() {
        return demo("版本管理");
    }

    @GetMapping("/help/demo")
    public R<Map<String, Object>> help() {
        return demo("帮助中心");
    }

    @GetMapping("/op-log/demo")
    public R<Map<String, Object>> opLog() {
        return demo("操作日志");
    }

    @GetMapping("/sync-log/demo")
    public R<Map<String, Object>> syncLog() {
        return demo("数据同步/上报日志");
    }

    private static R<Map<String, Object>> demo(String page) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", page);
        return R.ok(m);
    }
}
