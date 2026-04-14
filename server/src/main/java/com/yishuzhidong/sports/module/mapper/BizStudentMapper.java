package com.yishuzhidong.sports.module.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yishuzhidong.sports.module.entity.BizStudent;
import org.apache.ibatis.annotations.Mapper;

/**
 * 学生 Mapper（体测成绩写入前校验学生存在）。
 */
@Mapper
public interface BizStudentMapper extends BaseMapper<BizStudent> {
}
