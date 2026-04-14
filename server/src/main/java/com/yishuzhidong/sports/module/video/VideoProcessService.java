package com.yishuzhidong.sports.module.video;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 视频流处理占位服务：生产环境通过 FFmpeg 命令行或 JavaCV 拉流、转码、截图。
 * <p>
 * Docker 镜像需包含 ffmpeg 可执行文件，路径由配置 {@code video.ffmpeg-path} 指定。
 * </p>
 */
@Service
public class VideoProcessService {

    @Value("${video.ffmpeg-path:ffmpeg}")
    private String ffmpegPath;

    /**
     * 示例：返回本机 FFmpeg 路径，后续可封装 ProcessBuilder 调用。
     */
    public String getFfmpegPath() {
        return ffmpegPath;
    }
}
