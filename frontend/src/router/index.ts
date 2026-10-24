import { useUserStore } from "@/stores/user";
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
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("@/pages/Dashboard/Dashboard.vue"),
    children: [
      {
        path: "setting",
        name: "setting",
        component: () => import("@/pages/Setting/Setting.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(), //采用history模式
  routes,
});

router.beforeEach(async (to) => {
  const userStore = useUserStore();

  if (to.path === "/auth" && userStore.user) {
    return "/dashboard";
  }

  return true;
});

export default router;
