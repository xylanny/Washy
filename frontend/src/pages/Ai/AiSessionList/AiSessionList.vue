<template>
  <aside class="ai-sessions" :class="{ 'ai-sessions--open': open }">
    <div class="ai-sessions__header">
      <span class="ai-sessions__label">Chats</span>
      <button
        type="button"
        class="ai-sessions__add"
        title="New chat"
        @click="emits('create')"
        v-html="ICON_SVG_PLUS"
      ></button>
    </div>

    <p v-if="sessions.length === 0" class="ai-sessions__empty">
      No chats yet — ask a question to start one.
    </p>

    <ul class="ai-sessions__list">
      <li
        v-for="session in sessions"
        :key="session.id"
        class="ai-sessions__item"
        :class="{ 'is-active': session.id === activeId }"
        tabindex="0"
        @click="emits('select', session.id)"
        @keydown.enter.prevent="emits('select', session.id)"
      >
        <div class="ai-sessions__body">
          <span class="ai-sessions__title">{{
            session.title || "New chat"
          }}</span>
          <span class="ai-sessions__meta">{{ metaOf(session) }}</span>
        </div>

        <button
          type="button"
          class="ai-sessions__remove"
          title="Delete chat"
          @click.stop="emits('remove', session.id)"
          v-html="ICON_SVG_TRASH"
        ></button>
      </li>
    </ul>

    <div class="ai-sessions__foot">
      <span class="ai-sessions__foot-text"
        >History is kept in this browser.</span
      >
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { AiSession } from "@/stores/ai";
import { formatDate } from "@/utils/format";
import { ICON_SVG_PLUS, ICON_SVG_TRASH } from "../constants";

defineProps<{
  sessions: AiSession[];
  activeId: string;
  /** 当前模型名，展示在左下角 */
  model?: string;
  /** 窄屏时作为抽屉展开 */
  open?: boolean;
}>();

const emits = defineEmits<{
  select: [id: string];
  create: [];
  remove: [id: string];
}>();

function metaOf(session: AiSession): string {
  const count = session.messages.length;
  const when = formatDate(new Date(session.updatedAt), "MM-DD HH:mm");
  return count > 0 ? `${count} msg · ${when}` : when;
}
</script>

<style scoped lang="scss" src="./style.scss"></style>
