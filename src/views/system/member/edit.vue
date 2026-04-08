<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import {
  createMember,
  updateMember,
  getMemberList,
  type MemberDTO,
  type MemberBO,
  type AdminUserInfo
} from "@/api/member";

defineOptions({
  name: "MemberEditPage"
});

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const memberId = ref(route.query.memberId as string | undefined);
const loading = ref(false);
const isEditMode = ref(!!memberId.value);

// 表单数据
const formData = reactive<MemberDTO>({
  nickname: "",
  password: "",
  email: "",
  phone: "",
  gender: "",
  roleIds: false,
  status: "active"
});

const normalizeGender = (gender?: string) => {
  if (gender === "0" || gender === "1") return gender;
  if (gender === "M") return "0";
  if (gender === "F") return "1";
  return "";
};

const toMemberBO = (user: AdminUserInfo): MemberBO => {
  const nickname = user.nickname || user.username || "";
  return {
    id: user.id,
    memberInfo: {
      id: user.id,
      name: nickname,
      nickname,
      email: user.email || "",
      phone: user.phone || "",
      avatar: user.avatar,
      gender: user.gender,
      createTime: user.createTime || "",
      updateTime: user.updateTime || ""
    },
    roles: (user.roles || []).map((roleName, index) => ({
      id: `${index}-${roleName}`,
      roleName
    })),
    status: "active",
    createTime: user.createTime || "",
    updateTime: user.updateTime || ""
  };
};

// 表单验证规则
const rules = reactive<FormRules>({
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!isEditMode.value && !value) {
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
        if (!isEditMode.value && !value) {
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
  ],
  roleIds: []
});

/**
 * 加载成员信息（编辑模式）
 */
const loadMemberInfo = async () => {
  if (!memberId.value) return;

  loading.value = true;
  try {
    const res = await getMemberList({ page: 1, size: 500 });
    if (res.code === 200) {
      const hit = (res.data.records || []).find(
        item => item.id === memberId.value
      );
      if (!hit) {
        throw new Error("成员不存在");
      }
      const member = toMemberBO(hit);
      formData.nickname = member.memberInfo.nickname;
      formData.email = member.memberInfo.email;
      formData.phone = member.memberInfo.phone;
      formData.gender = normalizeGender(member.memberInfo.gender);
      formData.roleIds = (member.roles || []).some(
        role => role.roleName === "superadmin"
      );
      formData.status = member.status;
    } else {
      ElMessage.error("加载成员信息失败");
      router.back();
    }
  } catch (error) {
    console.error("加载成员信息失败:", error);
    ElMessage.error("加载成员信息失败");
    router.back();
  } finally {
    loading.value = false;
  }
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  const isValid = await formRef.value.validate().catch(() => false);
  if (!isValid) return;

  loading.value = true;
  try {
    let res;
    if (isEditMode.value && memberId.value) {
      // 编辑模式
      res = await updateMember(memberId.value, {
        nickname: formData.nickname,
        phone: formData.phone,
        password: formData.password,
        email: formData.email,
        gender: formData.gender,
        roleIds: formData.roleIds
      });
    } else {
      // 新增模式
      res = await createMember({
        nickname: formData.nickname,
        phone: formData.phone,
        password: formData.password,
        email: formData.email,
        gender: formData.gender
      });
    }

    if (res.code === 200) {
      ElMessage.success(isEditMode.value ? "成员更新成功" : "成员创建成功");
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

/**
 * 返回列表
 */
const handleCancel = () => {
  router.back();
};

onMounted(async () => {
  if (isEditMode.value) {
    await loadMemberInfo();
  }
});
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ isEditMode ? "编辑成员" : "新增成员" }}</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="max-w-2xl"
      >
        <!-- 基本信息 -->
        <div class="mb-6">
          <div class="text-base font-semibold mb-4">基本信息</div>

          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="formData.nickname"
              placeholder="请输入昵称"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item
            label="登录密码"
            prop="password"
            :required="!isEditMode"
          >
            <el-input
              v-model="formData.password"
              type="password"
              show-password
              :placeholder="
                isEditMode
                  ? '如需重置密码请输入新密码，不修改可留空'
                  : '请输入登录密码'
              "
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

        <!-- 联系方式 -->
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

          <el-form-item label="手机号" prop="phone" :required="!isEditMode">
            <el-input
              v-model="formData.phone"
              placeholder="请输入手机号"
              :disabled="loading"
            />
          </el-form-item>
        </div>

        <!-- 系统管理员升级 -->
        <div class="mb-6">
          <div class="text-base font-semibold mb-4">权限设置</div>

          <el-form-item label="系统管理员" prop="roleIds">
            <el-switch
              v-model="formData.roleIds"
              :disabled="loading"
              inline-prompt
              active-text="是"
              inactive-text="否"
            />
            <span class="ml-3 text-sm text-gray-500">
              选择“是”表示升级为系统超管
            </span>
          </el-form-item>
        </div>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            {{ isEditMode ? "更新" : "创建" }}
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
