package com.yishuzhidong.sports.module.pc;

import com.yishuzhidong.sports.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PC — 设备、RTSP、AI 算法配置（页面：设备管理、RTSP 流配置、AI 算法配置）。
 * AI 能力仅对接第三方 API，不自研模型；密钥从配置中心注入。
 */
@RestController
@RequestMapping("/api/pc/infra")
public class PcDeviceAndAiController {

    @GetMapping("/device/demo")
    public R<Map<String, Object>> device() {
        return demo("设备管理（摄像头/边缘盒子）");
    }

    @GetMapping("/rtsp/demo")
    public R<Map<String, Object>> rtsp() {
        return demo("RTSP 流配置");
    }

    @GetMapping("/ai-config/demo")
    public R<Map<String, Object>> aiConfig() {
        Map<String, Object> m = new HashMap<>(4);
        m.put("page", "AI 算法配置");
        m.put("provider", "baidu|aliyun|senseTime");
        return R.ok(m);
    }

    private static R<Map<String, Object>> demo(String page) {
        Map<String, Object> m = new HashMap<>(2);
        m.put("page", page);
        return R.ok(m);
    }
}
