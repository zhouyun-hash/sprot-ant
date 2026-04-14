# -*- coding: utf-8 -*-
"""AI 相关请求体模型（后续扩展图像 URL、Base64、业务参数等）。"""

from typing import Optional

from pydantic import BaseModel, Field


class VisionAnalyzeRequest(BaseModel):
    """视觉分析请求占位：对接阿里云视觉能力时使用。"""

    image_url: Optional[str] = Field(default=None, description="图片 URL")
    scene: str = Field(default="general", description="业务场景标识")


class PoseDetectionRequest(BaseModel):
    """人体姿态关键点识别请求。"""

    image_base64: str = Field(..., min_length=1, description="图片 Base64（不含 data:image 前缀）")


class ActionRecognitionRequest(BaseModel):
    """动作识别请求。"""

    video_url: str = Field(..., min_length=1, description="可公网访问的视频 URL")


class SkippingRequest(BaseModel):
    """跳绳动作分析请求。"""

    image_base64: str = Field(..., min_length=1, description="图片 Base64（单帧或连续帧）")
    session_id: Optional[str] = Field(
        default=None,
        description="会话 ID（建议传学生ID/设备ID），用于隔离计数状态",
    )
    reset: bool = Field(default=False, description="是否重置该会话计数")


class SitupRequest(BaseModel):
    """仰卧起坐分析请求。"""

    image_base64: str = Field(..., min_length=1, description="图片 Base64（单帧或连续帧）")
    session_id: Optional[str] = Field(
        default=None,
        description="会话 ID（建议传学生ID/设备ID），用于隔离计数状态",
    )
    reset: bool = Field(default=False, description="是否重置该会话计数")
