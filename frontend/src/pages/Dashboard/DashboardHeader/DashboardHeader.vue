<template>
  <header class="dashboard-header">
    <!-- File -->
    <Dropdown v-model:is-open="fileOpen" trigger-mode="click" align="bottom-left">
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

        <DropdownItem @click-item="handleCloseFile">
          <div class="dashboard-header__item">
            <span>Close</span>
            <span class="dashboard-header__shortcut">Ctrl+D</span>
          </div>
        </DropdownItem>
      </template>
    </Dropdown>

    <!-- Edit -->
    <Dropdown
      v-model:is-open="editOpen"
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

    <!-- Save：把当前图表导出成浏览器支持良好的图片格式 -->
    <Dropdown
      v-model:is-open="saveOpen"
      trigger-mode="click"
      align="bottom-left"
    >
      <template #trigger>
        <button
          class="dashboard-header__trigger"
          :title="canExport ? undefined : 'No chart on this page to save'"
        >
          <span>Save</span>
        </button>
      </template>

      <template #panel>
        <DropdownItem
          :is-disable="!canExport"
          @click-item="handleSaveChart('png')"
        >
          <div class="dashboard-header__item">
            <span>PNG</span>
            <span class="dashboard-header__shortcut">Ctrl + S</span>
          </div>
        </DropdownItem>

        <DropdownItem
          :is-disable="!canExport"
          @click-item="handleSaveChart('svg')"
        >
          <div class="dashboard-header__item">
            <span>SVG</span>
            <span class="dashboard-header__shortcut">Ctrl + Shift + S</span>
          </div>
        </DropdownItem>

        <DropdownItem
          :is-disable="!canExport"
          @click-item="handleSaveChart('jpeg')"
        >
          <div class="dashboard-header__item">
            <span>JPEG</span>
          </div>
        </DropdownItem>

        <DropdownItem
          :is-disable="!canExport"
          @click-item="handleSaveChart('webp')"
        >
          <div class="dashboard-header__item">
            <span>WebP</span>
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
import type { ChartExportFormat } from "@/utils/chartExport";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import Dropdown from "@/components/Dropdown/Dropdown.vue";
import DropdownItem from "@/components/Dropdown/DropdownItem.vue";
import { useChartStore } from "@/stores/chart";
import { useEditStore } from "@/stores/edit";
import { useTableStore } from "@/stores/table";

const router = useRouter();
const route = useRoute();
const tableStore = useTableStore();
const editStore = useEditStore();
const chartStore = useChartStore();
const { table } = storeToRefs(tableStore);
const { canSave, saving } = storeToRefs(chartStore);

const fileOpen = ref(false);
const editOpen = ref(false);
const saveOpen = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const canReset = computed(() => Boolean(editStore.resetHandler));

/** 当前页面有图表且没有正在导出时才能保存 */
const canExport = computed(() => canSave.value && !saving.value);

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

/** 导出当前图表：配置由 chart store 统一维护 */
function handleSaveChart(format: ChartExportFormat) {
  void chartStore.saveAs(format);
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

  // Ctrl + S / Ctrl + Shift + S：导出 PNG / SVG，没有图表时交给浏览器
  if (
    (e.ctrlKey || e.metaKey) &&
    !e.altKey &&
    e.key.toLowerCase() === "s" &&
    canExport.value
  ) {
    e.preventDefault();
    handleSaveChart(e.shiftKey ? "svg" : "png");
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
