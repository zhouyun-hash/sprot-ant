package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC 管理后台 — 驾驶舱、学校/年级/班级（需求文档页面：驾驶舱、学校信息管理、年级管理、班级管理）。
 */
@RestController
@RequestMapping("/api/pc")
public class PcCockpitAndSchoolController {

    /** 驾驶舱：汇总当日任务、达标率、预警等，与教师端/大屏同源缓存键。 */
    @GetMapping("/cockpit/summary")
    public R<Map<String, Object>> cockpitSummary() {
        Map<String, Object> m = new HashMap<>(4);
        m.put("page", "驾驶舱");
        m.put("todayTasks", 0);
        m.put("passRate", 0.0);
        return R.ok(m);
    }

    @GetMapping("/school/info/demo")
    public R<Map<String, Object>> schoolInfo() {
        return pageDemo("学校信息管理");
    }

    @GetMapping("/grade/demo")
    public R<Map<String, Object>> grade() {
        return pageDemo("年级管理");
    }

    @GetMapping("/class/demo")
    public R<Map<String, Object>> clazz() {
        return pageDemo("班级管理");
    }

    private static R<Map<String, Object>> pageDemo(String pageName) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", pageName);
        m.put("remark", "占位数据，后续接 Service + Mapper");
        return R.ok(m);
    }
}
