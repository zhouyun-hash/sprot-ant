package com.yishuzhidong.sports;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 蚁数智动智慧体育平台 — 启动类。
 * <p>
 * 实现「教—学—评—练—管」全流程闭环：PC 管理后台、教师端、学生端、家长端数据经本服务统一持久化，
 * 与 Redis 缓存协同，保证多端口径一致（参见需求文档「数据流转」）。
 * </p>
 */
@SpringBootApplication
@MapperScan("com.yishuzhidong.sports.module.**.mapper")
public class AntSportsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AntSportsApplication.class, args);
    }
}
