import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "root",
    component: () => import("@/pages/Home/Home.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(), //采用history模式
  routes,
});

export default router;
