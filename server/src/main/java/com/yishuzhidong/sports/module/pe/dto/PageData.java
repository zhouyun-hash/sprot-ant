package com.yishuzhidong.sports.module.pe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 分页数据包装（与 MyBatis-Plus IPage 对齐）。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageData<T> {

    private long total;
    private long current;
    private long size;
    private List<T> records;
}
