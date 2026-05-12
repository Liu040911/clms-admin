<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import {
  getUserMemberList,
  editUserMember,
  type UserMemberDTO,
  type UserMemberInfo
} from "@/api/userMember";
import { getRoleList } from "@/api/role";

defineOptions({
  name: "UserMemberEditPage"
});

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const userId = ref(route.query.userId as string | undefined);
const loading = ref(false);

const formData = reactive<UserMemberDTO>({
  nickname: "",
  password: "",
  email: "",
  phone: "",
  gender: "",
  roleIds: []
});

const roleOptions = ref<Array<{ id: string; name: string; roleName: string }>>([]);
const loadingRoles = ref(false);

const normalizeGender = (gender?: string) => {
  if (gender === "0" || gender === "1") return gender;
  if (gender === "M") return "0";
  if (gender === "F") return "1";
  return "";
};

const rules = reactive<FormRules>({
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!userId.value && !value) {
          callback(new Error("请输入密码"));
          return;
        }
        if (value && value.length < 6) {
          callback(new Error("密码长度不能少于6位"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ],
  email: [
    { type: "email", message: "邮箱格式不正确", trigger: "blur" },
    { required: false, trigger: "blur" }
  ],
  phone: [
    {
      validator: (_rule, value, callback) => {
        if (!userId.value && !value) {
          callback(new Error("请输入手机号"));
          return;
        }
        if (value && !/^1[3-9]\d{9}$/.test(value)) {
          callback(new Error("手机号格式不正确"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ]
});

const fetchRoleOptions = async () => {
  loadingRoles.value = true;
  try {
    const res = await getRoleList({ page: 1, size: 300 });
    if (res.code === 200) {
      roleOptions.value = (res.data.records || [])
        .filter(
          role =>
            role.roleName !== "admin" && role.roleName !== "superadmin"
        )
        .map(role => ({
          id: role.id,
          name: role.roleDescription || role.roleName,
          roleName: role.roleName
        }));
    }
  } catch (error) {
    console.error("获取角色列表失败:", error);
    ElMessage.error("获取角色列表失败");
  } finally {
    loadingRoles.value = false;
  }
};

const loadUserInfo = async () => {
  if (!userId.value) return;

  loading.value = true;
  try {
    const res = await getUserMemberList({ page: 1, size: 500 });
    if (res.code === 200) {
      const hit = (res.data.records || []).find(
        item => item.id === userId.value
      );
      if (!hit) {
        throw new Error("用户不存在");
      }
      formData.nickname = hit.nickname || "";
      formData.email = hit.email || "";
      formData.phone = hit.phone || "";
      formData.gender = normalizeGender(hit.gender);

      // 将角色名称映射为角色ID，回填多选
      const roleNameToId: Record<string, string> = {};
      roleOptions.value.forEach(opt => {
        roleNameToId[opt.roleName] = opt.id;
      });
      formData.roleIds = (hit.roles || [])
        .map(roleName => roleNameToId[roleName])
        .filter(Boolean);
    } else {
      ElMessage.error("加载用户信息失败");
      router.back();
    }
  } catch (error) {
    console.error("加载用户信息失败:", error);
    ElMessage.error("加载用户信息失败");
    router.back();
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  const isValid = await formRef.value.validate().catch(() => false);
  if (!isValid) return;

  loading.value = true;
  try {
    const res = await editUserMember({
      userId: userId.value,
      nickname: formData.nickname,
      phone: formData.phone,
      password: formData.password || undefined,
      email: formData.email,
      gender: formData.gender,
      roleIds: formData.roleIds && formData.roleIds.length > 0 ? formData.roleIds : undefined
    });

    if (res.code === 200) {
      ElMessage.success("用户信息更新成功");
      router.back();
    } else {
      ElMessage.error(res.msg || "操作失败");
    }
  } catch (error) {
    console.error("提交表单失败:", error);
    const err = error as any;
    const backendMsg = err?.response?.data?.msg || err?.msg || err?.message;
    ElMessage.error(backendMsg || "提交失败，请重试");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  router.back();
};

onMounted(async () => {
  await fetchRoleOptions();
  if (userId.value) {
    await loadUserInfo();
  }
});
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>编辑用户</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="max-w-2xl"
      >
        <div class="mb-6">
          <div class="text-base font-semibold mb-4">基本信息</div>

          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="formData.nickname"
              placeholder="请输入昵称"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item label="登录密码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              show-password
              placeholder="如需重置密码请输入新密码，不修改可留空"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item label="性别" prop="gender">
            <el-select
              v-model="formData.gender"
              placeholder="请选择性别"
              clearable
              :disabled="loading"
            >
              <el-option label="男" value="0" />
              <el-option label="女" value="1" />
            </el-select>
          </el-form-item>
        </div>

        <div class="mb-6">
          <div class="text-base font-semibold mb-4">联系方式</div>

          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="formData.email"
              type="email"
              placeholder="请输入邮箱"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="formData.phone"
              placeholder="请输入手机号"
              :disabled="loading"
            />
          </el-form-item>
        </div>

        <div class="mb-6">
          <div class="text-base font-semibold mb-4">角色设置</div>

          <el-form-item label="用户角色" prop="roleIds">
            <el-select
              v-model="formData.roleIds"
              placeholder="请选择角色（可多选）"
              class="w-full"
              multiple
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="3"
              :loading="loadingRoles"
              :disabled="loading"
              clearable
            >
              <el-option
                v-for="role in roleOptions"
                :key="role.id"
                :label="role.name"
                :value="role.id"
              />
            </el-select>
            <span class="ml-3 text-sm text-gray-500">
              可为用户分配非管理员角色
            </span>
          </el-form-item>
        </div>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            更新
          </el-button>
          <el-button :disabled="loading" @click="handleCancel">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
