package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC — 数据中心/大屏相关（班级运动数据、年级统计、全校体质大屏、达标率、项目薄弱分析）。
 */
@RestController
@RequestMapping("/api/pc/stats")
public class PcDataStatsController {

    @GetMapping("/class-sports/demo")
    public R<Map<String, Object>> classSports() {
        return demo("班级运动数据");
    }

    @GetMapping("/grade/demo")
    public R<Map<String, Object>> gradeStats() {
        return demo("年级数据统计");
    }

    @GetMapping("/screen/demo")
    public R<Map<String, Object>> screen() {
        return demo("全校体质大屏");
    }

    @GetMapping("/pass-rate/demo")
    public R<Map<String, Object>> passRate() {
        return demo("达标率统计");
    }

    @GetMapping("/weak-project/demo")
    public R<Map<String, Object>> weakProject() {
        return demo("项目薄弱分析");
    }

    private static R<Map<String, Object>> demo(String page) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", page);
        return R.ok(m);
    }
}
