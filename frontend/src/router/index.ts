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
  {
    path: "/auth",
    name: "auth",
    component: () => import("@/pages/Auth/Auth.vue"),
    // 将查询参数变成组件props
    props: (route) => ({ query: route.query }),
  },
];

const router = createRouter({
  history: createWebHistory(), //采用history模式
  routes,
});

export default router;
