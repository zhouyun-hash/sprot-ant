import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../store/user_store.dart';
import '../../widgets/base_list_page.dart';
import '../../widgets/load_state_view.dart';

class MinePage extends StatelessWidget {
  const MinePage({super.key});

  @override
  Widget build(BuildContext context) {
    final userStore = Get.find<UserStore>();
    return Obx(
      () {
        final items = <Map<String, dynamic>>[
          {'title': '姓名', 'value': userStore.user.value?.name ?? '-'},
          {'title': '账号', 'value': userStore.user.value?.username ?? '-'},
          {'title': '角色', 'value': userStore.user.value?.role ?? '-'},
          {
            'title': '个人设置',
            'value': null,
            'action': () => Get.toNamed('/mine/settings'),
          },
          {
            'title': '退出登录',
            'value': null,
            'danger': true,
            'action': () async {
              await userStore.logout();
              Get.offAllNamed('/login');
            },
          },
        ];
        return LoadStateView(
          loading: false,
          error: null,
          isEmpty: false,
          emptyText: '',
          onRefresh: () async {},
          child: BaseListPage<Map<String, dynamic>>(
            items: items,
            itemBuilder: (_, item, __) => ListTile(
              title: Text(
                item['title']?.toString() ?? '-',
                style: TextStyle(color: item['danger'] == true ? Colors.red : null),
              ),
              trailing: item['action'] != null && item['danger'] != true
                  ? const Icon(Icons.chevron_right)
                  : Text(item['value']?.toString() ?? '-'),
              onTap: item['action'],
            ),
          ),
        );
      },
    );
  }
}
