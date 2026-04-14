package com.yishuzhidong.sports.module.pe.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 成绩返回：aiRawData 已解析为 Map。
 */
@Data
public class PeScoreVO {

    private Long id;
    private Long studentId;
    private Long taskId;
    private String project;
    private String result;
    private String unit;
    private Map<String, Object> aiRawData;
    private String reviewStatus;
    private LocalDateTime createdAt;
}
