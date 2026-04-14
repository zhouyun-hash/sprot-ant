import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../utils/http.dart';
import '../../widgets/load_state_view.dart';

class TestDetailPage extends StatefulWidget {
  const TestDetailPage({super.key});

  @override
  State<TestDetailPage> createState() => _TestDetailPageState();
}

class _TestDetailPageState extends State<TestDetailPage> {
  bool _loading = false;
  String? _error;
  String _value = '-';

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    final metric = (Get.arguments ?? <String, dynamic>{}) as Map<String, dynamic>;
    final key = metric['key']?.toString();
    if (key == null || key.isEmpty) {
      setState(() => _error = '缺少指标Key');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await Http.dio.get('/dashboard/overview');
      final data = res.data as Map<String, dynamic>? ?? const {};
      final raw = data[key];
      _value = raw == null ? '-' : raw.toString();
      if (key == 'avgExerciseMinutes' && _value != '-') {
        _value = '$_value 分钟';
      }
    } catch (_) {
      _error = '体测指标加载失败';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final metric = (Get.arguments ?? <String, dynamic>{}) as Map<String, dynamic>;
    return Scaffold(
      appBar: AppBar(title: const Text('体测指标详情')),
      body: LoadStateView(
        loading: _loading,
        error: _error,
        isEmpty: _value == '-',
        emptyText: '暂无指标详情',
        onRefresh: _loadDetail,
        child: ListView(
          children: [
            ListTile(title: const Text('指标'), trailing: Text('${metric['title'] ?? '-'}')),
            ListTile(title: const Text('当前值'), trailing: Text(_value)),
          ],
        ),
      ),
    );
  }
}
