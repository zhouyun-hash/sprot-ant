import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../models/user.dart';
import '../../store/user_store.dart';
import '../../utils/http.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _studentNoController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;

  Future<void> _loginWithPassword() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      final Response res = await Http.dio.post(
        '/auth/login',
        data: {
          'username': _studentNoController.text.trim(),
          'password': _passwordController.text,
        },
      );
      final data = res.data as Map<String, dynamic>? ?? {};
      final token =
          (data['access_token'] ?? data['token'])?.toString() ?? '';
      if (token.isEmpty) throw Exception('登录失败：token为空');
      await Get.find<UserStore>().setAuth(
        tokenValue: token,
        userValue: data['user'] is Map<String, dynamic> ? UserModel.fromJson(data['user']) : null,
      );
      Get.offAllNamed('/home');
    } catch (e) {
      Get.snackbar('登录失败', e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loginWithFace() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      final picker = ImagePicker();
      final XFile? photo = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1280,
      );
      if (photo == null) return;

      final bytes = await photo.readAsBytes();
      final imageBase64 = base64Encode(bytes);
      if (imageBase64.length < 100) {
        throw Exception('图片数据过短，请重新拍摄');
      }

      final Response res = await Http.dio.post(
        '/auth/face-login',
        data: {'imageBase64': imageBase64},
      );
      final data = res.data as Map<String, dynamic>? ?? {};
      final token =
          (data['access_token'] ?? data['token'])?.toString() ?? '';
      if (token.isEmpty) throw Exception('人脸登录失败：token为空');
      await Get.find<UserStore>().setAuth(
        tokenValue: token,
        userValue: data['user'] is Map<String, dynamic> ? UserModel.fromJson(data['user']) : null,
      );
      Get.offAllNamed('/home');
    } catch (e) {
      Get.snackbar('人脸登录失败', e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('登录')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _studentNoController,
              decoration: const InputDecoration(labelText: '学号'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: '密码'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _loading ? null : _loginWithPassword,
              child: const Text('学号密码登录'),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: _loading ? null : _loginWithFace,
              child: const Text('人脸登录'),
            ),
          ],
        ),
      ),
    );
  }
}
