<template>
  <section class="table">
    <div class="table__show" :ref="setContainerRef" @scroll="handleScroll">
      <div v-if="!table" class="table__empty">
        <span>Quick Open</span>
        <span>Ctrl + O</span>
      </div>
      <table v-else class="table__real" :style="{ width: `${tableWidth}px` }">
        <colgroup>
          <col class="table__col-index" />
          <col
            v-for="h in table.headers"
            :key="`col-${h}`"
            class="table__col-data"
          />
        </colgroup>
        <thead class="table__thead" :style="{ width: `${tableWidth}px` }">
          <tr class="table__tr table__tr--header">
            <th class="table__th table__th--index">#</th>
            <th v-for="h in table.headers" :key="h" class="table__th">
              <div>{{ h }}</div>
            </th>
          </tr>
        </thead>

        <tbody
          class="table__tbody"
          :style="{
            height: `${contentH}px`,
            width: `${tableWidth}px`,
          }"
        >
          <tr
            v-for="(row, idx) in vRows"
            :key="sIdx + idx"
            class="table__tr table__tr--body"
            :style="{
              transform: `translateY(${offsetY + idx * unitH}px)`,
              width: `${tableWidth}px`,
            }"
          >
            <td class="table__td table__td--index">{{ sIdx + idx + 1 }}</td>
            <td v-for="header in table.headers" :key="header" class="table__td">
              <div class="table__cell">
                <input
                  class="table__input"
                  :value="row[header] ?? ''"
                  @change="
                    updateRow(
                      sIdx + idx,
                      header,
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import Lenis from "lenis";
import { storeToRefs } from "pinia";
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useTableStore } from "@/stores/table";
import { useVirtualList } from "@/composables/useVirtualList";

const tableStore = useTableStore();
const { table, rows } = storeToRefs(tableStore);
const { updateRow } = tableStore;

const unitH = 42;
const visibleH = 600;
const bufferN = 6;
const indexColumnW = 54;
const dataColumnW = 160;

const visibleRef = ref<HTMLElement | null>(null);
const lenis = ref<Lenis | null>(null);
let animationFrame = 0;

const {
  contentH,
  sIdx,
  offsetY,
  getVisibleData,
  setScrollTop,
  resetScrollTop,
  scrollTo,
} = useVirtualList({
  unitH,
  total: computed(() => rows.value ?? 0),
  visibleH,
  bufferN,
});

const vRows = computed(() => {
  if (!table.value) return [];
  return getVisibleData<Record<string, any>>(table.value.rows);
});

const tableWidth = computed(() => {
  if (!table.value) return 0;
  return indexColumnW + table.value.headers.length * dataColumnW;
});

function setContainerRef(
  element: Element | import("vue").ComponentPublicInstance | null,
) {
  visibleRef.value = element instanceof HTMLElement ? element : null;
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement;
  setScrollTop(target.scrollTop);
}

function destroySmoothScroll() {
  if (lenis.value) {
    lenis.value.destroy();
    lenis.value = null;
  }
}

function animate(time: number) {
  lenis.value?.raf(time);
  animationFrame = requestAnimationFrame(animate);
}

async function initializeSmoothScroll() {
  await nextTick();
  const wrapper = visibleRef.value;
  const content = wrapper?.querySelector(".table__real") || wrapper;
  if (!wrapper || !(content instanceof HTMLElement)) return;

  destroySmoothScroll();
  lenis.value = new Lenis({
    wrapper,
    content,
    autoRaf: false,
  });
  lenis.value.on("scroll", ({ scroll }) => {
    setScrollTop(scroll);
  });
}

defineExpose({
  scrollTo,
  resetScrollTop,
});

onMounted(() => {
  animationFrame = requestAnimationFrame(animate);
  if (table.value?.rows.length) {
    void initializeSmoothScroll();
  }
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrame);
  destroySmoothScroll();
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
