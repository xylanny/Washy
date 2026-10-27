<template>
  <div class="profile-identity">
    <!-- 头像本身即入口：点击选图，选完立即进入待保存状态 -->
    <button
      type="button"
      class="profile-identity__avatar"
      :disabled="disabled || busy"
      title="Change avatar"
      aria-label="Change avatar"
      @click="openPicker"
    >
      <img v-if="avatarSrc" :src="avatarSrc" :alt="name" />
      <span v-else class="profile-identity__initial">{{ initial }}</span>

      <span class="profile-identity__overlay" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
          />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </span>
    </button>

    <div class="profile-identity__main">
      <!-- 点击名字就地改成输入框，改完点 Save 提交 -->
      <ProfileEditable
        size="title"
        :model-value="name"
        placeholder="Your name"
        :disabled="disabled || busy"
        @update:model-value="handleName"
      />

      <span class="profile-identity__email" :title="email">{{ email }}</span>
    </div>

    <input
      ref="fileInputRef"
      class="profile-identity__file"
      type="file"
      accept="image/*"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import type { ProfileIdentityEmits, ProfileIdentityProps } from "./types";
import { computed, ref } from "vue";
import ProfileEditable from "../ProfileEditable/ProfileEditable.vue";
import { cropSquareImageBase64 } from "@/utils/image";
import {
  AVATAR_DATA_PREFIX,
  AVATAR_QUALITY,
  AVATAR_SIZE,
  MAX_AVATAR_BYTES,
} from "../constants";

const props = withDefaults(defineProps<ProfileIdentityProps>(), {
  avatar: "",
  disabled: false,
});

const emits = defineEmits<ProfileIdentityEmits>();

const fileInputRef = ref<HTMLInputElement | null>(null);
/** 正在裁剪图片，避免重复触发 */
const busy = ref(false);

const avatarSrc = computed(() =>
  props.avatar ? `${AVATAR_DATA_PREFIX}${props.avatar}` : "",
);

const initial = computed(
  () => (props.name.trim() || "Unnamed").slice(0, 1).toUpperCase(),
);

function handleName(value: string): void {
  emits("update:name", value);
}

function openPicker(): void {
  if (props.disabled || busy.value) return;

  fileInputRef.value?.click();
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = "";

  if (!file) return;

  if (file.size > MAX_AVATAR_BYTES) {
    emits("error", "Image is too large (max 5 MB)");

    return;
  }

  busy.value = true;

  try {
    // 统一裁成正方形再交给后端，避免存下一张几 MB 的原图
    const base64 = await cropSquareImageBase64(
      file,
      AVATAR_SIZE,
      AVATAR_QUALITY,
    );

    emits("update:avatar", base64);
  } catch {
    emits("error", "Could not read that image");
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped lang="scss" src="./style.scss"></style>
