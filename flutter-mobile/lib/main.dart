import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'pages/class/class_detail.dart';
import 'pages/class/class_list.dart';
import 'pages/class/live_score.dart';
import 'pages/classroom/classroom_detail_page.dart';
import 'pages/home/home_page.dart';
import 'pages/homework/create.dart';
import 'pages/homework/homework_detail_page.dart';
import 'pages/homework/submissions.dart';
import 'pages/login/login_page.dart';
import 'pages/mine/settings_page.dart';
import 'store/user_store.dart';
import 'pages/task/checkin.dart';
import 'pages/task/task_list.dart';
import 'pages/test/test_detail_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Get.put(UserStore(), permanent: true);
  await Get.find<UserStore>().restoreToken();
  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    final userStore = Get.find<UserStore>();
    return GetMaterialApp(
      title: '智慧体育',
      debugShowCheckedModeBanner: false,
      initialRoute: userStore.token.value.isEmpty ? '/login' : '/home',
      getPages: [
        GetPage(name: '/login', page: () => const LoginPage()),
        GetPage(name: '/home', page: () => const HomePage()),
        GetPage(name: '/class/list', page: () => const ClassListPage()),
        GetPage(name: '/class/detail', page: () => const ClassDetailPage()),
        GetPage(name: '/live_score', page: () => const LiveScorePage()),
        GetPage(name: '/classroom/detail', page: () => const ClassroomDetailPage()),
        GetPage(name: '/test/detail', page: () => const TestDetailPage()),
        GetPage(name: '/homework/detail', page: () => const HomeworkDetailPage()),
        GetPage(name: '/homework/create', page: () => const HomeworkCreatePage()),
        GetPage(
          name: '/homework/:homeworkId/submissions',
          page: () => const HomeworkSubmissionsPage(),
        ),
        GetPage(name: '/mine/settings', page: () => const SettingsPage()),
        GetPage(name: '/task/list', page: () => const TaskListPage()),
        GetPage(name: '/task/checkin', page: () => const CheckinPage()),
      ],
    );
  }
}
