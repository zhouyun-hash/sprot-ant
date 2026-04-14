package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC — 体测项目、标准、计划、批次、场地（体测管理核心链路，配置需同步教师端/学生端）。
 * <p><b>体测任务已落地接口：</b>{@code /api/pe/tasks}（CRUD、发布、状态流转）。</p>
 */
@RestController
@RequestMapping("/api/pc/physical")
public class PcPhysicalTestController {

    @GetMapping("/project/demo")
    public R<Map<String, Object>> project() {
        return demo("体测项目管理");
    }

    @GetMapping("/standard/demo")
    public R<Map<String, Object>> standard() {
        return demo("体测标准配置");
    }

    @GetMapping("/plan/demo")
    public R<Map<String, Object>> plan() {
        return demo("体测计划管理");
    }

    @GetMapping("/batch/demo")
    public R<Map<String, Object>> batch() {
        return demo("体测批次管理");
    }

    @GetMapping("/venue/demo")
    public R<Map<String, Object>> venue() {
        return demo("场地管理");
    }

    private static R<Map<String, Object>> demo(String page) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", page);
        return R.ok(m);
    }
}
