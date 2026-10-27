<template>
  <section class="profile">
    <main class="profile__body">
      <!-- 登录态 / 保存失败等提示 -->
      <p v-if="userStore.message" class="profile__notice" role="alert">
        <span class="profile__notice-text">{{ userStore.message }}</span>
        <button
          type="button"
          class="profile__notice-close"
          title="Dismiss"
          aria-label="Dismiss"
          @click="userStore.message = ''"
          v-html="ICON_SVG_CLOSE"
        ></button>
      </p>

      <section class="profile__card">
        <ProfileIdentity
          :name="draft.userName"
          :email="user?.userEmail || 'Not signed in'"
          :avatar="draft.userAvatar || user?.userAvatar || ''"
          :disabled="saving || !user"
          @update:name="setName"
          @update:avatar="setAvatar"
          @error="setError"
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

      <section class="profile__card">
        <ProfileDetails title="Account" :items="details" />
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import type { UserUpdateDTO } from "@/api/types";
import type { ProfileDetailItem, ProfileDraft } from "./types";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ProfileIdentity from "./ProfileIdentity/ProfileIdentity.vue";
import ProfileDetails from "./ProfileDetails/ProfileDetails.vue";
import { useUserStore } from "@/stores/user";
import { ICON_SVG_CLOSE } from "./constants";

const userStore = useUserStore();
const router = useRouter();

const draft = ref<ProfileDraft>({ userName: "", userAvatar: "" });
const saving = ref(false);
const status = ref("");

const user = computed(() => userStore.user);

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
  { label: "Created", value: formatTimestamp(user.value?.createTime) },
  { label: "Updated", value: formatTimestamp(user.value?.updateTime) },
]);

/** 接口返回的是 ISO 时间，展示成 `YYYY-MM-DD HH:mm` */
function formatTimestamp(value?: string): string {
  if (!value) return "—";

  return value
    .replace("T", " ")
    .replace(/\.\d+/, "")
    .replace(/Z$/, "")
    .slice(0, 16);
}

function resetDraft(): void {
  draft.value = { userName: user.value?.userName ?? "", userAvatar: "" };
}

function setName(value: string): void {
  draft.value.userName = value;
  status.value = "";
}

function setAvatar(value: string): void {
  draft.value.userAvatar = value;
  status.value = "";
}

function setError(message: string): void {
  userStore.message = message;
}

/** 进入页面时恢复登录态（已登录则直接跳过） */
onMounted(async () => {
  await userStore.resume();
  resetDraft();
});

async function save(): Promise<void> {
  if (!canSave.value) return;

  const payload: UserUpdateDTO = {};
  const name = draft.value.userName.trim();

  if (name && name !== (user.value?.userName ?? "")) payload.userName = name;
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
</script>

<style scoped lang="scss" src="./style.scss"></style>
