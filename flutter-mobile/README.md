# flutter-mobile

## 运行

1. 安装 Flutter SDK 并确保 `flutter` 可执行。
2. 在本目录执行：

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://你的后端地址
```

## 已实现页面

- 登录：`lib/pages/login/login_page.dart`
- 首页（底部导航）：`lib/pages/home/home_page.dart`
  - 课堂教学：`lib/pages/classroom/classroom_page.dart`
  - 体测：`lib/pages/test/test_page.dart`
  - 作业：`lib/pages/homework/homework_page.dart`
  - 我的：`lib/pages/mine/mine_page.dart`

## 网络与状态

- Dio：`lib/utils/http.dart`
- 用户状态：`lib/store/user_store.dart`
- 用户模型：`lib/models/user.dart`
