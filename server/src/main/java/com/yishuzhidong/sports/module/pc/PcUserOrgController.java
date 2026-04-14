package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC 管理后台 — 学生、教职工、角色权限、账号（页面：学生信息、教职工、角色权限、账号管理）。
 */
@RestController
@RequestMapping("/api/pc/org")
public class PcUserOrgController {

    @GetMapping("/student/demo")
    public R<Map<String, Object>> student() {
        return demo("学生信息管理");
    }

    @GetMapping("/staff/demo")
    public R<Map<String, Object>> staff() {
        return demo("教职工管理");
    }

    @GetMapping("/role/demo")
    public R<Map<String, Object>> role() {
        return demo("角色权限管理");
    }

    @GetMapping("/account/demo")
    public R<Map<String, Object>> account() {
        return demo("账号管理");
    }

    private static R<Map<String, Object>> demo(String page) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", page);
        m.put("items", java.util.Collections.emptyList());
        return R.ok(m);
    }
}
