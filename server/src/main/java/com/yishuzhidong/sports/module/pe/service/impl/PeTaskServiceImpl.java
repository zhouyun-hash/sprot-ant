package com.yishuzhidong.sports.module.pe.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yishuzhidong.sports.common.exception.BusinessException;
import com.yishuzhidong.sports.common.util.JsonHelper;
import com.yishuzhidong.sports.module.entity.PeTask;
import com.yishuzhidong.sports.module.mapper.PeTaskMapper;
import com.yishuzhidong.sports.module.pe.constants.PeConstants;
import com.yishuzhidong.sports.module.pe.dto.PageData;
import com.yishuzhidong.sports.module.pe.dto.PeTaskSaveRequest;
import com.yishuzhidong.sports.module.pe.dto.PeTaskVO;
import com.yishuzhidong.sports.module.pe.service.PeTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 体测任务业务实现。
 */
@Service
@RequiredArgsConstructor
public class PeTaskServiceImpl implements PeTaskService {

    private final PeTaskMapper peTaskMapper;
    private final JsonHelper jsonHelper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(PeTaskSaveRequest request) {
        validateTimeRange(request);
        PeTask entity = new PeTask();
        fillEntity(entity, request, true);
        if (!StringUtils.hasText(entity.getStatus())) {
            entity.setStatus(PeConstants.TASK_DRAFT);
        }
        peTaskMapper.insert(entity);
        return entity.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, PeTaskSaveRequest request) {
        PeTask existing = peTaskMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "体测任务不存在: " + id);
        }
        validateTimeRange(request);
        fillEntity(existing, request, false);
        peTaskMapper.updateById(existing);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (peTaskMapper.selectById(id) == null) {
            throw new BusinessException(404, "体测任务不存在: " + id);
        }
        // 库表成绩 ON DELETE CASCADE，删除任务会级联删除成绩
        peTaskMapper.deleteById(id);
    }

    @Override
    public PeTaskVO get(Long id) {
        PeTask e = peTaskMapper.selectById(id);
        if (e == null) {
            throw new BusinessException(404, "体测任务不存在: " + id);
        }
        return toVo(e);
    }

    @Override
    public PageData<PeTaskVO> page(long current, long size, String status, String nameKeyword) {
        LambdaQueryWrapper<PeTask> q = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) {
            q.eq(PeTask::getStatus, status);
        }
        if (StringUtils.hasText(nameKeyword)) {
            q.like(PeTask::getName, nameKeyword);
        }
        q.orderByDesc(PeTask::getStartTime);
        Page<PeTask> p = peTaskMapper.selectPage(new Page<>(current, size), q);
        List<PeTaskVO> list = p.getRecords().stream().map(this::toVo).collect(Collectors.toList());
        return new PageData<>(p.getTotal(), p.getCurrent(), p.getSize(), list);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void publish(Long id) {
        PeTask e = requireTask(id);
        if (PeConstants.TASK_CANCELLED.equals(e.getStatus())) {
            throw new BusinessException("已取消的任务不能发布");
        }
        e.setStatus(PeConstants.TASK_PUBLISHED);
        peTaskMapper.updateById(e);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancel(Long id) {
        PeTask e = requireTask(id);
        e.setStatus(PeConstants.TASK_CANCELLED);
        peTaskMapper.updateById(e);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markOngoing(Long id) {
        PeTask e = requireTask(id);
        e.setStatus(PeConstants.TASK_ONGOING);
        peTaskMapper.updateById(e);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markFinished(Long id) {
        PeTask e = requireTask(id);
        e.setStatus(PeConstants.TASK_FINISHED);
        peTaskMapper.updateById(e);
    }

    private PeTask requireTask(Long id) {
        PeTask e = peTaskMapper.selectById(id);
        if (e == null) {
            throw new BusinessException(404, "体测任务不存在: " + id);
        }
        return e;
    }

    private void validateTimeRange(PeTaskSaveRequest request) {
        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new BusinessException("结束时间不能早于开始时间");
        }
    }

    /** isCreate=true 时 status 取请求或默认 draft；更新时仅覆盖非空字段 */
    private void fillEntity(PeTask entity, PeTaskSaveRequest request, boolean isCreate) {
        entity.setName(request.getName());
        entity.setType(request.getType());
        entity.setStartTime(request.getStartTime());
        entity.setEndTime(request.getEndTime());
        entity.setGradeIds(jsonHelper.toJson(request.getGradeIds()));
        entity.setClassIds(jsonHelper.toJson(request.getClassIds()));
        entity.setProjectIds(jsonHelper.toJson(request.getProjectIds()));
        if (StringUtils.hasText(request.getStatus())) {
            entity.setStatus(request.getStatus());
        }
    }

    private PeTaskVO toVo(PeTask e) {
        PeTaskVO vo = new PeTaskVO();
        vo.setId(e.getId());
        vo.setName(e.getName());
        vo.setType(e.getType());
        vo.setGradeIds(jsonHelper.parseLongList(e.getGradeIds()));
        vo.setClassIds(jsonHelper.parseLongList(e.getClassIds()));
        vo.setProjectIds(jsonHelper.parseLongList(e.getProjectIds()));
        vo.setStartTime(e.getStartTime());
        vo.setEndTime(e.getEndTime());
        vo.setStatus(e.getStatus());
        return vo;
    }
}
