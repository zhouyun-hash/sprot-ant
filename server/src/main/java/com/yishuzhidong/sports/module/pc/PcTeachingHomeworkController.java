package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC — 体育课表、教学计划、资源库、课后作业、作业批改（教学与作业闭环）。
 */
@RestController
@RequestMapping("/api/pc/teaching")
public class PcTeachingHomeworkController {

    @GetMapping("/schedule/demo")
    public R<Map<String, Object>> schedule() {
        return demo("体育课表管理");
    }

    @GetMapping("/plan/demo")
    public R<Map<String, Object>> plan() {
        return demo("教学计划");
    }

    @GetMapping("/resource/demo")
    public R<Map<String, Object>> resource() {
        return demo("教学资源库");
    }

    @GetMapping("/homework/demo")
    public R<Map<String, Object>> homework() {
        return demo("课后作业管理");
    }

    @GetMapping("/homework-grade/demo")
    public R<Map<String, Object>> homeworkGrade() {
        return demo("作业批改");
    }

    private static R<Map<String, Object>> demo(String page) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", page);
        return R.ok(m);
    }
}
