package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC — 成绩实时监控、成绩列表、异常审核、视频回放（与体测采集、学生端成绩同源）。
 * <p><b>成绩已落地接口：</b>{@code /api/pe/scores}（分页、按任务/学生、复核、upsert）。</p>
 */
@RestController
@RequestMapping("/api/pc/exam")
public class PcExamScoreController {

    @GetMapping("/monitor/demo")
    public R<Map<String, Object>> monitor() {
        return demo("成绩实时监控");
    }

    @GetMapping("/score-list/demo")
    public R<Map<String, Object>> scoreList() {
        return demo("成绩列表");
    }

    @GetMapping("/audit/demo")
    public R<Map<String, Object>> audit() {
        return demo("异常成绩审核");
    }

    @GetMapping("/video/demo")
    public R<Map<String, Object>> video() {
        return demo("视频回放");
    }

    private static R<Map<String, Object>> demo(String page) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", page);
        return R.ok(m);
    }
}
