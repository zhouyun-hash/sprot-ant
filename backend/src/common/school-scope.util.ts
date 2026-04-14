/** 可跨校查看/管理基础数据的角色（集团/系统级） */
export function canManageAllSchools(role: string): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'group_admin';
}

/** 学校管理员可不受“教师个人范围”限制（业务口径：学校管理员例外） */
export function isSchoolAdminRole(role: string): boolean {
  return role === 'school_admin';
}
