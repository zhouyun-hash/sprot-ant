package com.yishuzhidong.sports.module.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 体测成绩表实体，对应 `score`。
 * <p>
 * 同一学生、同一任务、同一项目唯一一行（uk_score_student_task_project）。
 * ai_raw_data 存第三方 AI 回传结构 JSON 字符串。
 * </p>
 */
@Data
@TableName("`score`")
public class PeScore {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long studentId;
    private Long taskId;
    /** 项目标识或名称，如 跳绳、50米跑 */
    private String project;
    private String result;
    private String unit;
    /** AI 原始 JSON 字符串 */
    private String aiRawData;
    /** pending / approved / rejected */
    private String reviewStatus;
    private LocalDateTime createdAt;
}
