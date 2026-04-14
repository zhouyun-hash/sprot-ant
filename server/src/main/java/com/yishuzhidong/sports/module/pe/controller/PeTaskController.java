package com.yishuzhidong.sports.module.pe.controller;

import com.yishuzhidong.sports.common.result.R;
import com.yishuzhidong.sports.module.pe.dto.PageData;
import com.yishuzhidong.sports.module.pe.dto.PeTaskSaveRequest;
import com.yishuzhidong.sports.module.pe.dto.PeTaskVO;
import com.yishuzhidong.sports.module.pe.service.PeTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * 体测任务 REST（PC 管理端、教师端共用；教师仅查询/执行权限由后续鉴权控制）。
 */
@RestController
@RequestMapping("/api/pe/tasks")
@RequiredArgsConstructor
public class PeTaskController {

    private final PeTaskService peTaskService;

    @PostMapping
    public R<Long> create(@Valid @RequestBody PeTaskSaveRequest request) {
        return R.ok(peTaskService.create(request));
    }

    @PutMapping("/{id}")
    public R<Void> update(@PathVariable Long id, @Valid @RequestBody PeTaskSaveRequest request) {
        peTaskService.update(id, request);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        peTaskService.delete(id);
        return R.ok();
    }

    @GetMapping("/{id}")
    public R<PeTaskVO> get(@PathVariable Long id) {
        return R.ok(peTaskService.get(id));
    }

    @GetMapping("/page")
    public R<PageData<PeTaskVO>> page(
            @RequestParam(defaultValue = "1") long current,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String nameKeyword) {
        return R.ok(peTaskService.page(current, size, status, nameKeyword));
    }

    @PostMapping("/{id}/publish")
    public R<Void> publish(@PathVariable Long id) {
        peTaskService.publish(id);
        return R.ok();
    }

    @PostMapping("/{id}/cancel")
    public R<Void> cancel(@PathVariable Long id) {
        peTaskService.cancel(id);
        return R.ok();
    }

    @PostMapping("/{id}/ongoing")
    public R<Void> ongoing(@PathVariable Long id) {
        peTaskService.markOngoing(id);
        return R.ok();
    }

    @PostMapping("/{id}/finish")
    public R<Void> finish(@PathVariable Long id) {
        peTaskService.markFinished(id);
        return R.ok();
    }
}
