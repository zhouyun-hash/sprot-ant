package com.yishuzhidong.sports.module.mobile;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 学生端小程序 API（24 页：登录人脸、自主训练、体测查看、排行榜、勋章、安全等）。
 */
@RestController
@RequestMapping("/api/app/student")
public class StudentAppController {

    @GetMapping("/home/demo")
    public R<Map<String, Object>> home() {
        return demo("学生端-首页");
    }

    @GetMapping("/training/demo")
    public R<Map<String, Object>> training() {
        return demo("学生端-自主训练");
    }

    @GetMapping("/score/demo")
    public R<Map<String, Object>> score() {
        return demo("学生端-我的成绩/体测查看");
    }

    private static R<Map<String, Object>> demo(String name) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("screen", name);
        m.put("tip", "详见需求文档学生端 24 页");
        return R.ok(m);
    }
}
