package com.yishuzhidong.sports.module.pe.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 创建/更新体测任务请求体（PC 管理端下发，同步教师端待办）。
 */
@Data
public class PeTaskSaveRequest {

    @NotBlank(message = "任务名称不能为空")
    private String name;

    @NotBlank(message = "任务类型不能为空")
    private String type;

    /** 年级 ID 列表，可选 */
    private List<Long> gradeIds;
    private List<Long> classIds;
    /** 体测项目 ID 列表，可选 */
    private List<Long> projectIds;

    @NotNull(message = "开始时间不能为空")
    private LocalDateTime startTime;

    @NotNull(message = "结束时间不能为空")
    private LocalDateTime endTime;

    /** 新建默认 draft；更新时可不传表示不改 */
    private String status;
}
