import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../utils/http.dart';
import '../../widgets/load_state_view.dart';

class ClassListPage extends StatefulWidget {
  const ClassListPage({super.key});

  @override
  State<ClassListPage> createState() => _ClassListPageState();
}

class _ClassListPageState extends State<ClassListPage> {
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _items = const [];

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
      final Response res = await Http.dio.get('/teachers/me/classes');
      final data = res.data as Map<String, dynamic>? ?? {};
      final raw = (data['items'] as List?) ?? const [];
      setState(() {
        _items = raw
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      });
    } on DioException catch (e) {
      final msg = e.response?.data;
      String text = '班级列表加载失败';
      if (msg is Map && msg['message'] != null) {
        final m = msg['message'];
        text = m is List ? m.join(', ') : m.toString();
      } else if (e.message != null) {
        text = e.message!;
      }
      setState(() => _error = text);
    } catch (_) {
      setState(() => _error = '班级列表加载失败');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('我的班级')),
      body: LoadStateView(
        loading: _loading,
        error: _error,
        isEmpty: _items.isEmpty,
        emptyText: '暂无任课班级',
        onRefresh: _loadData,
        child: ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: _items.length,
          itemBuilder: (context, index) {
            final item = _items[index];
            final name = item['name']?.toString() ?? '未命名班级';
            final count = item['studentCount'];
            final studentText = count == null ? '-' : count.toString();
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Card(
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => Get.toNamed('/class/detail', arguments: item),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const CircleAvatar(
                          child: Icon(Icons.class_),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '学生数：$studentText',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
