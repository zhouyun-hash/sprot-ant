import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../store/user_store.dart';
import '../../utils/http.dart';

class HomeworkCreatePage extends StatefulWidget {
  const HomeworkCreatePage({super.key});

  @override
  State<HomeworkCreatePage> createState() => _HomeworkCreatePageState();
}

class _HomeworkCreatePageState extends State<HomeworkCreatePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  DateTime? _deadline;
  final Set<int> _selectedClassIds = {};

  bool _classesLoading = false;
  String? _classesError;
  List<Map<String, dynamic>> _classes = const [];

  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadClasses() async {
    setState(() {
      _classesLoading = true;
      _classesError = null;
    });
    try {
      Response res;
      try {
        res = await Http.dio.get('/teachers/me/classes');
      } on DioException {
        res = await Http.dio.get(
          '/classes',
          queryParameters: {'page': 1, 'pageSize': 200},
        );
      }
      final data = res.data as Map<String, dynamic>? ?? {};
      final raw = (data['items'] as List?) ?? const [];
      setState(() {
        _classes = raw
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      });
    } catch (_) {
      setState(() => _classesError = '班级列表加载失败');
    } finally {
      if (mounted) setState(() => _classesLoading = false);
    }
  }

  Future<void> _pickDeadline() async {
    final now = DateTime.now();
    final initial = _deadline ?? now.add(const Duration(days: 1));
    final d = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now.add(const Duration(days: 1)) : initial,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: DateTime(now.year + 2),
    );
    if (d == null || !mounted) return;
    setState(() {
      _deadline = DateTime(d.year, d.month, d.day, 23, 59, 59);
    });
  }

  String _formatDeadline(DateTime d) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${d.year}-${two(d.month)}-${two(d.day)} ${two(d.hour)}:${two(d.minute)}';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_deadline == null) {
      Get.snackbar('提示', '请选择截止日期');
      return;
    }
    if (_selectedClassIds.isEmpty) {
      Get.snackbar('提示', '请至少选择一个班级');
      return;
    }

    final userId = Get.find<UserStore>().user.value?.id;
    if (userId == null) {
      Get.snackbar('提示', '无法获取当前用户，请重新登录');
      return;
    }

    setState(() => _submitting = true);
    try {
      final body = <String, dynamic>{
        'title': _titleCtrl.text.trim(),
        'deadline': _deadline!.toIso8601String(),
        'classIds': _selectedClassIds.toList()..sort(),
        'createdBy': userId,
      };
      final desc = _descCtrl.text.trim();
      if (desc.isNotEmpty) body['description'] = desc;

      await Http.dio.post('/homework', data: body);
      if (mounted) {
        Get.snackbar('成功', '作业已布置');
        Get.back();
      }
    } on DioException catch (e) {
      final msg = e.response?.data;
      String text = '提交失败';
      if (msg is Map && msg['message'] != null) {
        final m = msg['message'];
        text = m is List ? m.join(', ') : m.toString();
      } else if (e.message != null) {
        text = e.message!;
      }
      Get.snackbar('布置作业', text);
    } catch (e) {
      Get.snackbar('布置作业', e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  int? _classIdOf(Map<String, dynamic> c) {
    final v = c['id'];
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('布置作业')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleCtrl,
              decoration: const InputDecoration(
                labelText: '标题',
                border: OutlineInputBorder(),
              ),
              maxLength: 128,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return '请输入标题';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descCtrl,
              decoration: const InputDecoration(
                labelText: '描述',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
              maxLines: 4,
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('截止日期'),
              subtitle: Text(
                _deadline == null
                    ? '点击选择日期（默认当天 23:59:59）'
                    : _formatDeadline(_deadline!),
              ),
              trailing: const Icon(Icons.calendar_today_outlined),
              onTap: _pickDeadline,
            ),
            const Divider(height: 32),
            Text(
              '选择班级（多选）',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            if (_classesLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_classesError != null)
              Text(
                _classesError!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              )
            else if (_classes.isEmpty)
              Text(
                '暂无班级可选',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              )
            else
              ..._classes.map((c) {
                final id = _classIdOf(c);
                if (id == null) return const SizedBox.shrink();
                final name = c['name']?.toString() ?? '班级 $id';
                final checked = _selectedClassIds.contains(id);
                return CheckboxListTile(
                  value: checked,
                  onChanged: (v) {
                    setState(() {
                      if (v == true) {
                        _selectedClassIds.add(id);
                      } else {
                        _selectedClassIds.remove(id);
                      }
                    });
                  },
                  title: Text(name),
                  controlAffinity: ListTileControlAffinity.leading,
                );
              }),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Theme.of(context).colorScheme.onPrimary,
                      ),
                    )
                  : const Text('提交'),
            ),
          ],
        ),
      ),
    );
  }
}
