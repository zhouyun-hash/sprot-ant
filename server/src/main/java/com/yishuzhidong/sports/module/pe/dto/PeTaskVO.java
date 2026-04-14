package com.yishuzhidong.sports.module.pe.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 体测任务返回：JSON 字段已解析为 List，便于前端展示。
 */
@Data
public class PeTaskVO {

    private Long id;
    private String name;
    private String type;
    private List<Long> gradeIds;
    private List<Long> classIds;
    private List<Long> projectIds;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
}
