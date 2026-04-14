package com.yishuzhidong.sports.module.mobile;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 教师端 APP API（Uniapp 教师端分包页面共 32 屏，此处按模块聚合占位）。
 * 涵盖：首页、班级、课堂、体测、作业、家校、安全、个人中心等。
 */
@RestController
@RequestMapping("/api/app/teacher")
public class TeacherAppController {

    @GetMapping("/home/demo")
    public R<Map<String, Object>> home() {
        return demo("教师端-首页");
    }

    @GetMapping("/class/demo")
    public R<Map<String, Object>> clazz() {
        return demo("教师端-我的班级");
    }

    @GetMapping("/lesson/demo")
    public R<Map<String, Object>> lesson() {
        return demo("教师端-课堂教学");
    }

    @GetMapping("/exam/demo")
    public R<Map<String, Object>> exam() {
        return demo("教师端-体测/发起测试");
    }

    @GetMapping("/homework/demo")
    public R<Map<String, Object>> homework() {
        return demo("教师端-作业");
    }

    private static R<Map<String, Object>> demo(String name) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("screen", name);
        m.put("tip", "详见需求文档教师端 32 页，按页面补全 Service");
        return R.ok(m);
    }
}
