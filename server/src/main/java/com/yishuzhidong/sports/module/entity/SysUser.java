package com.yishuzhidong.sports.module.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 系统用户表实体，对应库表 user（登录账号，多端共用一套账号体系）。
 */
@Data
@TableName("`user`")
public class SysUser {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String role;
    private String name;
    private String phone;
    private String avatar;
    private LocalDateTime createdAt;
}
