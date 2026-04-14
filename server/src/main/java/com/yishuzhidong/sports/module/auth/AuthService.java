package com.yishuzhidong.sports.module.auth;

import com.yishuzhidong.sports.module.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 认证服务：登录、令牌颁发（后续可接 JWT + Redis 会话）。
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper sysUserMapper;

    /**
     * 占位登录：返回示例结构，后续校验密码并写 Redis 会话。
     */
    public Map<String, Object> loginDemo(String username) {
        Long count = sysUserMapper.selectCount(null);
        Map<String, Object> token = new HashMap<>(4);
        token.put("accessToken", "demo-token");
        token.put("expiresIn", 7200);
        Map<String, Object> user = new HashMap<>(4);
        user.put("username", username);
        user.put("role", "admin");
        Map<String, Object> body = new HashMap<>(4);
        body.put("token", token);
        body.put("user", user);
        body.put("dbUserCountHint", count);
        return body;
    }
}
