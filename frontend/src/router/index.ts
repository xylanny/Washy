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

  if (to.path === "/auth" && userStore.user) {
    return "/dashboard";
  }

  return true;
});

export default router;
