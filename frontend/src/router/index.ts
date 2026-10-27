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
    redirect: "/dashboard/table",
    children: [
      {
        path: "ai",
        name: "ai",
        component: () => import("@/pages/Ai/Ai.vue"),
      },
      {
        path: "setting",
        name: "setting",
        component: () => import("@/pages/Setting/Setting.vue"),
      },
      {
        path: "table",
        name: "table",
        component: () => import("@/pages/Table/Table.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("@/pages/Profile/Profile.vue"),
      },
      {
        path: "chart/line",
        name: "line",
        component: () => import("@/pages/Chart/ChartLine/ChartLine.vue"),
      },
      {
        path: "chart/bar",
        name: "bar",
        component: () => import("@/pages/Chart/ChartBar/ChartBar.vue"),
      },
      {
        path: "chart/pie",
        name: "pie",
        component: () => import("@/pages/Chart/ChartPie/ChartPie.vue"),
      },
      {
        path: "chart/scatter",
        name: "scatter",
        component: () => import("@/pages/Chart/ChartScatter/ChartScatter.vue"),
      },
      {
        path: "chart/heatmap",
        name: "heatmap",
        component: () => import("@/pages/Chart/ChartHeatmap/ChartHeatmap.vue"),
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

  // 面板页必须登录：在这里等会话恢复完成再渲染，
  // 否则刷新 /dashboard 时页面已经渲染，却还不知道当前用户是谁
  if (to.path === "/dashboard" || to.path.startsWith("/dashboard/")) {
    const state = await userStore.ensureSession();

    if (state === "anon") {
      return {
        name: "auth",
        query: { mode: "login", redirect: to.fullPath },
      };
    }

    // error（网络/服务异常）时放行：token 没被清掉，页面里会有错误提示，可重试
    return true;
  }

  if (to.path === "/auth" && userStore.user) {
    return "/dashboard";
  }

  return true;
});

export default router;
