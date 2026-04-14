package com.yishuzhidong.sports.module.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 第三方 AI 调用门面：对接百度、阿里云、商汤等开放 API，禁止在此编写自研推理逻辑。
 * <p>
 * 密钥通过环境变量注入（见 application.yml 中 ai.* 配置），各具体能力按项目再拆 Service。
 * </p>
 */
@Component
public class ThirdPartyAiClient {

    @Value("${ai.provider:baidu}")
    private String provider;

    /**
     * 占位：人脸检测 / 人体关键点等，后续按厂商 SDK 或 HTTP 封装。
     */
    public String getProvider() {
        return provider;
    }
}
