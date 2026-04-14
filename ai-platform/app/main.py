# -*- coding: utf-8 -*-
"""AI 能力中台：FastAPI 入口，挂载路由、CORS、日志。"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ai as ai_router
from app.utils.logger import get_logger, setup_logging

setup_logging(logging.INFO if os.getenv("DEBUG") != "1" else logging.DEBUG)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI platform started")
    yield


app = FastAPI(
    title="AI 能力中台",
    description="统一封装第三方 AI（阿里云视觉等）",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS：生产环境应收紧为具体前端域名；多域名用逗号分隔，如 https://a.com,https://b.com
_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router.router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    """健康检查：负载均衡 / K8s 探针使用。"""
    return {"status": "ok", "service": "ai-platform"}
