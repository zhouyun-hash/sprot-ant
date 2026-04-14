class UserModel {
  final int? id;
  final String? username;
  final String? name;
  final String? role;
  final String? phone;

  const UserModel({
    this.id,
    this.username,
    this.name,
    this.role,
    this.phone,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse('${json['id']}'),
      username: json['username']?.toString(),
      name: json['name']?.toString(),
      role: json['role']?.toString(),
      phone: json['phone']?.toString(),
    );
  }
}
