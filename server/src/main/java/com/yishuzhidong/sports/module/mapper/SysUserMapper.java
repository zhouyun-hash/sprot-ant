package com.yishuzhidong.sports.module.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yishuzhidong.sports.module.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户 Mapper：后续扩展按角色查询教师/家长绑定等。
 */
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
}
