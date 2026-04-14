package com.yishuzhidong.sports.module.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 学生表实体（成绩外键校验用，仅依赖 id 存在性）。
 */
@Data
@TableName("student")
public class BizStudent {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String studentNo;
    private Long classId;
}
