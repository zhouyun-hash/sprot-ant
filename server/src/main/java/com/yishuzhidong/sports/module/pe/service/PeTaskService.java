package com.yishuzhidong.sports.module.pe.service;

import com.yishuzhidong.sports.module.pe.dto.PageData;
import com.yishuzhidong.sports.module.pe.dto.PeTaskSaveRequest;
import com.yishuzhidong.sports.module.pe.dto.PeTaskVO;

/**
 * 体测任务：创建、发布、查询，配置为全端口径来源。
 */
public interface PeTaskService {

    Long create(PeTaskSaveRequest request);

    void update(Long id, PeTaskSaveRequest request);

    void delete(Long id);

    PeTaskVO get(Long id);

    PageData<PeTaskVO> page(long current, long size, String status, String nameKeyword);

    /** 发布后教师端可见待办 */
    void publish(Long id);

    void cancel(Long id);

    /** 标记进行中（可选：到达开始时间后由定时任务调用） */
    void markOngoing(Long id);

    void markFinished(Long id);
}
