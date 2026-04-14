package com.yishuzhidong.sports.module.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 体测任务表实体，对应 `task`。
 * <p>
 * grade_ids / class_ids / project_ids 存 JSON 数组字符串，与 PC 端配置、教师端任务列表口径一致。
 * </p>
 */
@Data
@TableName("`task`")
public class PeTask {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    /** 类型：教学/月考/期中/期末 等 */
    private String type;
    /** JSON 数组字符串，如 [7,8] */
    private String gradeIds;
    private String classIds;
    private String projectIds;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    /** draft / published / ongoing / finished / cancelled */
    private String status;
}
