import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../store/user_store.dart';
import '../../utils/http.dart';
import '../../widgets/load_state_view.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _loading = false;
  String? _error;
  Map<String, dynamic> _profile = const {};

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await Http.dio.get('/auth/profile');
      _profile = res.data as Map<String, dynamic>? ?? const {};
    } catch (_) {
      // 后端未提供该接口时，兜底用本地用户信息
      final user = Get.find<UserStore>().user.value;
      if (user != null) {
        _profile = {
          'name': user.name,
          'username': user.username,
          'phone': user.phone,
          'role': user.role,
        };
      } else {
        _error = '个人信息加载失败';
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('个人设置')),
      body: LoadStateView(
        loading: _loading,
        error: _error,
        isEmpty: _profile.isEmpty,
        emptyText: '暂无个人信息',
        onRefresh: _loadProfile,
        child: ListView(
          children: [
            ListTile(title: const Text('姓名'), trailing: Text('${_profile['name'] ?? '-'}')),
            ListTile(title: const Text('账号'), trailing: Text('${_profile['username'] ?? '-'}')),
            ListTile(title: const Text('手机号'), trailing: Text('${_profile['phone'] ?? '-'}')),
            ListTile(title: const Text('角色'), trailing: Text('${_profile['role'] ?? '-'}')),
            const Divider(),
            ListTile(
              title: const Text('修改密码'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Get.snackbar('提示', '后续可接入修改密码接口'),
            ),
            ListTile(
              title: const Text('关于'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Get.defaultDialog(title: '关于', middleText: '智慧体育移动端'),
            ),
          ],
        ),
      ),
    );
  }
}
