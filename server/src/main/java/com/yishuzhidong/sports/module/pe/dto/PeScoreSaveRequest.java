package com.yishuzhidong.sports.module.pe.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.Map;

/**
 * 录入或更新成绩（可来自 AI 自动采集或教师补录）。
 */
@Data
public class PeScoreSaveRequest {

    @NotNull(message = "学生 ID 不能为空")
    private Long studentId;

    @NotNull(message = "体测任务 ID 不能为空")
    private Long taskId;

    @NotBlank(message = "项目不能为空")
    private String project;

    @NotBlank(message = "成绩值不能为空")
    private String result;

    private String unit;

    /** AI 原始结构化数据，可选 */
    private Map<String, Object> aiRawData;

    /** 新建默认 pending；更新时可不传 */
    private String reviewStatus;
}
