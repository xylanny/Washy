<template>
  <section class="profile">
    <header class="profile__heading">
      <div class="profile__heading-inner">
        <h1 class="profile__title">Profile</h1>
      </div>
    </header>

    <main class="profile__body">
      <!-- 头像 + 基本信息 -->
      <section class="profile__card">
        <div class="profile__identity">
          <!-- 头像本身即入口：点击选图，松手即进入待保存状态 -->
          <button
            type="button"
            class="profile__avatar"
            :disabled="saving || !user"
            title="Change avatar"
            aria-label="Change avatar"
            @click="openAvatarPicker"
          >
            <img v-if="avatarSrc" :src="avatarSrc" :alt="displayName" />
            <span v-else class="profile__avatar-fallback">{{ initial }}</span>

            <span class="profile__avatar-overlay" aria-hidden="true">
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

          <div class="profile__identity-main">
            <!-- 点击名字就地改成输入框，改完点 Save 提交 -->
            <ProfileEditable
              size="title"
              :model-value="draft.userName"
              placeholder="Your name"
              :disabled="saving || !user"
              @update:model-value="setName"
            />

            <span class="profile__email">
              {{ user?.userEmail || "Not signed in" }}
            </span>
          </div>

          <input
            ref="avatarInputRef"
            class="profile__file"
            type="file"
            accept="image/*"
            @change="handleAvatarChange"
          />
        </div>

        <el-alert
          v-if="userStore.message"
          :title="userStore.message"
          type="error"
          closable
          @close="userStore.message = ''"
        />

        <p v-if="status" class="profile__status">{{ status }}</p>

        <form class="profile__actions" @submit.prevent="save">
          <button type="submit" class="profile__button" :disabled="!canSave">
            {{ saving ? "Saving…" : "Save" }}
          </button>

          <button
            type="button"
            class="profile__button profile__button--ghost"
            @click="signOut"
          >
            Sign out
          </button>
        </form>
      </section>

      <!-- 账号只读信息 -->
      <section class="profile__card">
        <h2 class="profile__card-title">Account</h2>

        <dl class="profile__details">
          <div
            v-for="item in details"
            :key="item.label"
            class="profile__detail"
          >
            <dt class="profile__detail-label">{{ item.label }}</dt>
            <dd class="profile__detail-value">{{ item.value }}</dd>
          </div>
        </dl>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import type { UserUpdateDTO } from "@/api/types";
import type { ProfileDetailItem, ProfileDraft } from "./types";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ProfileEditable from "./ProfileEditable/ProfileEditable.vue";
import { useUserStore } from "@/stores/user";
import {
  AVATAR_DATA_PREFIX,
  AVATAR_QUALITY,
  AVATAR_SIZE,
  MAX_AVATAR_BYTES,
} from "./constants";

const userStore = useUserStore();
const router = useRouter();

const avatarInputRef = ref<HTMLInputElement | null>(null);
const draft = ref<ProfileDraft>({ userName: "", userAvatar: "" });
const saving = ref(false);
const status = ref("");

const user = computed(() => userStore.user);

const displayName = computed(
  () => draft.value.userName.trim() || user.value?.userName || "Unnamed",
);

const initial = computed(() => displayName.value.slice(0, 1).toUpperCase());

const avatarSrc = computed(() => {
  const base64 = draft.value.userAvatar || user.value?.userAvatar;

  return base64 ? `${AVATAR_DATA_PREFIX}${base64}` : "";
});

const canSave = computed(() => {
  if (saving.value || !user.value) return false;

  // 空名字不提交，清空只是方便重新输入
  const name = draft.value.userName.trim();
  const nameChanged = name !== "" && name !== (user.value.userName ?? "");

  return nameChanged || Boolean(draft.value.userAvatar);
});

const details = computed<ProfileDetailItem[]>(() => [
  { label: "User ID", value: user.value?.id ? String(user.value.id) : "—" },
  { label: "Email", value: user.value?.userEmail || "—" },
  { label: "Role", value: user.value?.userRole || "—" },
  { label: "Created", value: user.value?.createTime || "—" },
  { label: "Updated", value: user.value?.updateTime || "—" },
]);

function resetDraft(): void {
  draft.value = { userName: user.value?.userName ?? "", userAvatar: "" };
}

/** 进入页面时恢复登录态（已登录则直接跳过） */
onMounted(async () => {
  await userStore.resume();
  resetDraft();
});

function setName(value: string | number | undefined): void {
  draft.value.userName = String(value ?? "");
  status.value = "";
}

function openAvatarPicker(): void {
  avatarInputRef.value?.click();
}

async function handleAvatarChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = "";

  if (!file) return;

  if (file.size > MAX_AVATAR_BYTES) {
    userStore.message = "Image is too large (max 5 MB)";
    return;
  }

  try {
    draft.value.userAvatar = await toAvatarBase64(file);
    status.value = "";
  } catch {
    userStore.message = "Could not read that image";
  }
}

async function save(): Promise<void> {
  if (!canSave.value) return;

  const payload: UserUpdateDTO = {};
  const name = draft.value.userName.trim();

  if (name && name !== (user.value?.userName ?? ""))
    payload.userName = name;
  if (draft.value.userAvatar) payload.userAvatar = draft.value.userAvatar;

  if (!payload.userName && !payload.userAvatar) return;

  saving.value = true;
  userStore.message = "";
  status.value = "";

  try {
    await userStore.update(payload);

    if (userStore.message) return;

    resetDraft();
    status.value = "Profile updated";
  } catch (error) {
    userStore.message =
      error instanceof Error ? error.message : "Update failed";
  } finally {
    saving.value = false;
  }
}

async function signOut(): Promise<void> {
  userStore.logout();
  await router.replace("/auth");
}

/** ===== 头像处理：读文件 → 居中裁方 → 转 JPEG base64 ===== */

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Read file failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Load image failed"));
    image.src = src;
  });
}

async function toAvatarBase64(file: File): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const side = Math.min(image.width, image.height);
  const context = canvas.getContext("2d");

  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  if (!context) return dataUrl.split(",")[1] ?? "";

  context.drawImage(
    image,
    (image.width - side) / 2,
    (image.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );

  return (
    canvas.toDataURL("image/jpeg", AVATAR_QUALITY).split(",")[1] ?? ""
  );
}
</script>

<style scoped lang="scss" src="./style.scss"></style>
