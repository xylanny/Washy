<template>
  <header class="dashboard-header">
    <Dropdown v-model:is-open="isOpen" trigger-mode="click" align="bottom-left">
      <template #trigger>
        <button class="dashboard-header__trigger">
          <span>File</span>
        </button>
      </template>

      <template #panel>
        <DropdownItem @click-item="openFilePicker">
          <div class="dashboard-header__item">
            <span>Open</span>
            <span class="dashboard-header__shortcut">Ctrl + O</span>
          </div>
        </DropdownItem>

        <DropdownItem @click-item="handleBackToTable">
          <div class="dashboard-header__item">
            <span>Back</span>
            <span class="dashboard-header__shortcut">Ctrl + B</span>
          </div>
        </DropdownItem>

        <Dropdown trigger-mode="hover" align="top-right" :offset="0">
          <template #trigger>
            <button class="dashboard-header__item">
              <span>Save as...</span>
              <span class="dashboard-header__arrow" v-html="ICON_SVG_GO"></span>
            </button>
          </template>

          <template #panel>
            <DropdownItem>
              <div class="dashboard-header__item">
                <span>CSV</span>
                <span class="dashboard-header__shortcut">Ctrl + Shift + C</span>
              </div>
            </DropdownItem>
            <DropdownItem>
              <div class="dashboard-header__item">
                <span>Excel</span>
                <span class="dashboard-header__shortcut">Ctrl + Shift + E</span>
              </div>
            </DropdownItem>
          </template>
        </Dropdown>

        <DropdownItem @click-item="handleCloseFile">
          <div class="dashboard-header__item">
            <span>Close</span>
            <span class="dashboard-header__shortcut">Ctrl+D</span>
          </div>
        </DropdownItem>
      </template>
    </Dropdown>

    <Dropdown
      v-model:is-open="isEditOpen"
      trigger-mode="click"
      align="bottom-left"
    >
      <template #trigger>
        <button class="dashboard-header__trigger">
          <span>Edit</span>
        </button>
      </template>

      <template #panel>
        <!-- 具体动作由当前页面注册，没有页面注册时置灰 -->
        <DropdownItem :is-disable="!canReset" @click-item="handleReset">
          <div class="dashboard-header__item">
            <span>Reset</span>
            <span class="dashboard-header__shortcut">Ctrl + R</span>
          </div>
        </DropdownItem>
      </template>
    </Dropdown>

    <!-- 隐藏的文件上传 input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".csv,.xlsx,.xls"
      style="display: none"
      @change="handleChangeFile"
    />
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import Dropdown from "@/components/Dropdown/Dropdown.vue";
import DropdownItem from "@/components/Dropdown/DropdownItem.vue";
import { ICON_SVG_GO } from "./constants";
import { useEditStore } from "@/stores/edit";
import { useTableStore } from "@/stores/table";

const router = useRouter();
const route = useRoute();
const tableStore = useTableStore();
const editStore = useEditStore();
const { table } = storeToRefs(tableStore);

const isOpen = ref(false);
const isEditOpen = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const canReset = computed(() => Boolean(editStore.resetHandler));

function handleReset() {
  editStore.reset();
}

function openFilePicker() {
  fileInputRef.value?.click();
}

async function handleChangeFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (route.path !== "/dashboard/table") {
    await router.push("/dashboard/table");
  }

  try {
    await tableStore.parseFileToTable(file);
  } catch (err) {
    console.error(err);
  } finally {
    input.value = "";
  }
}

function handleCloseFile() {
  tableStore.clearTable();
}

function handleBackToTable() {
  router.push("/dashboard/table");
}

function handleKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  const isInput =
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable;
  if (isInput || e.isComposing) return;

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
    e.preventDefault();
    openFilePicker();
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
    e.preventDefault();
    if (table.value) {
      handleCloseFile();
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
    e.preventDefault();
    handleBackToTable();
  }

  // Ctrl + R：重置当前页面的编辑内容（没有页面注册时让浏览器正常刷新）
  if (
    (e.ctrlKey || e.metaKey) &&
    !e.shiftKey &&
    !e.altKey &&
    e.key.toLowerCase() === "r" &&
    canReset.value
  ) {
    e.preventDefault();
    handleReset();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped lang="scss" src="./style.scss"></style>
