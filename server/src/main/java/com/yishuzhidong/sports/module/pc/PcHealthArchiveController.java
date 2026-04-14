package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC — 学生体质档案、运动处方（与家长端/学生端体质报告同源）。
 */
@RestController
@RequestMapping("/api/pc/health")
public class PcHealthArchiveController {

    @GetMapping("/archive/demo")
    public R<Map<String, Object>> archive() {
        return demo("学生体质档案");
    }

    @GetMapping("/prescription/demo")
    public R<Map<String, Object>> prescription() {
        return demo("运动处方管理");
    }

    private static R<Map<String, Object>> demo(String page) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", page);
        return R.ok(m);
    }
}
