import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../utils/http.dart';
import '../../widgets/base_list_page.dart';
import '../../widgets/load_state_view.dart';

class TestPage extends StatefulWidget {
  const TestPage({super.key});

  @override
  State<TestPage> createState() => _TestPageState();
}

class _TestPageState extends State<TestPage> {
  bool _loading = false;
  String? _error;
  Map<String, dynamic> _overview = const {};

  List<Map<String, String>> get _metrics => [
        {
          'title': '达标率',
          'key': 'passRate',
          'value': '${_overview['passRate'] ?? '-'}',
        },
        {
          'title': '优秀率',
          'key': 'excellentRate',
          'value': '${_overview['excellentRate'] ?? '-'}',
        },
        {
          'title': '人均运动时长',
          'key': 'avgExerciseMinutes',
          'value': '${_overview['avgExerciseMinutes'] ?? '-'} 分钟',
        },
      ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final Response res = await Http.dio.get('/dashboard/overview');
      setState(() => _overview = (res.data as Map<String, dynamic>? ?? const {}));
    } catch (_) {
      setState(() => _error = '体测概览加载失败');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LoadStateView(
      loading: _loading,
      error: _error,
      isEmpty: _overview.isEmpty,
      emptyText: '暂无体测概览数据',
      onRefresh: _loadData,
      child: BaseListPage<Map<String, String>>(
        items: _metrics,
        itemBuilder: (_, item, __) => ListTile(
          title: Text(item['title'] ?? '-'),
          trailing: Text(item['value'] ?? '-'),
          onTap: () => Get.toNamed('/test/detail', arguments: {'title': item['title'], 'key': item['key']}),
        ),
      ),
    );
  }
}
