package com.yishuzhidong.sports.module.mobile;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 家长端小程序 API（18 页：绑定、孩子总览、体测、作业、报告、安全提醒等）。
 */
@RestController
@RequestMapping("/api/app/parent")
public class ParentAppController {

    @GetMapping("/home/demo")
    public R<Map<String, Object>> home() {
        return demo("家长端-孩子数据总览");
    }

    @GetMapping("/bind/demo")
    public R<Map<String, Object>> bind() {
        return demo("家长端-登录绑定");
    }

    @GetMapping("/report/demo")
    public R<Map<String, Object>> report() {
        return demo("家长端-月度/学期报告");
    }

    private static R<Map<String, Object>> demo(String name) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("screen", name);
        m.put("tip", "详见需求文档家长端 18 页");
        return R.ok(m);
    }
}
