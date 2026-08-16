<template>
  <div class="dashboard">
    <section class="dashboard-heading">
      <div>
        <h1>{{ t("home.welcome", { username: userStore.user.username }) }}</h1>
      </div>
      <div class="updated-at">
        <span class="status-dot"></span>
        {{ t("home.updatedAt", { time: "10:24" }) }}
      </div>
    </section>

    <section class="metric-grid">
      <article v-for="item in metrics" :key="item.id" class="metric-card">
        <div class="metric-card__top">
          <span>{{ item.label }}</span>
          <span :style="{ color: item.color, backgroundColor: item.background }" class="metric-icon">
            <component :is="item.icon" :size="16" :stroke-width="1.5" />
          </span>
        </div>
        <strong>{{ item.value }}</strong>
        <div class="metric-card__footer">
          <span :class="['trend', item.trend > 0 ? 'trend--up' : 'trend--down']">
            <TrendingUp v-if="item.trend > 0" :size="16" :stroke-width="1.5" />
            <TrendingDown v-else :size="16" :stroke-width="1.5" />
            {{ Math.abs(item.trend) }}%
          </span>
          <span>{{ t("home.comparedToYesterday") }}</span>
        </div>
      </article>
    </section>

    <section class="chart-grid chart-grid--primary">
      <article class="panel trend-panel">
        <div class="panel-heading">
          <div>
            <h2>{{ t("home.salesTrend.title") }}</h2>
            <p>{{ t("home.salesTrend.description") }}</p>
          </div>
          <div class="legend-summary">
            <span>
              <i class="legend-dot legend-dot--blue"></i>
              {{ t("home.salesAmount") }}
            </span>
            <span>
              <i class="legend-dot legend-dot--cyan"></i>
              {{ t("home.orderCount") }}
            </span>
          </div>
        </div>
        <v-chart :option="salesOption" autoresize class="chart chart--trend" />
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>{{ t("home.orderSource.title") }}</h2>
            <p>{{ t("home.orderSource.description") }}</p>
          </div>
          <button :aria-label="t('home.viewMore')" class="more-button" type="button">
            <Ellipsis :size="16" :stroke-width="1.5" />
          </button>
        </div>
        <v-chart :option="sourceOption" autoresize class="chart chart--pie" />
        <div class="source-legend">
          <div v-for="item in sourceData" :key="item.name">
            <span>
              <i :style="{ backgroundColor: item.itemStyle.color }"></i>
              {{ item.name }}
            </span>
            <strong>{{ item.value }}%</strong>
          </div>
        </div>
      </article>
    </section>

    <section class="chart-grid chart-grid--secondary">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>{{ t("home.channelConversion.title") }}</h2>
            <p>{{ t("home.channelConversion.description") }}</p>
          </div>
        </div>
        <v-chart :option="channelOption" autoresize class="chart chart--bar" />
      </article>

      <article class="panel order-panel">
        <div class="panel-heading">
          <div>
            <h2>{{ t("home.recentOrders.title") }}</h2>
            <p>{{ t("home.recentOrders.description") }}</p>
          </div>
          <button class="text-button" type="button">
            {{ t("home.viewAll") }}
            <ChevronRight :size="16" :stroke-width="1.5" />
          </button>
        </div>
        <div class="order-list">
          <div v-for="order in recentOrders" :key="order.id" class="order-row">
            <div :style="{ background: order.avatarColor }" class="customer-avatar">{{ order.customer[0] }}</div>
            <div class="order-customer">
              <strong>{{ order.customer }}</strong>
              <span>{{ order.id }}</span>
            </div>
            <div class="order-product">{{ order.product }}</div>
            <div class="order-amount">¥{{ order.amount }}</div>
            <span :class="['order-status', `order-status--${order.statusType}`]">{{ order.status }}</span>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { type Component, computed, inject, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import {
  ChevronRight,
  CircleDollarSign,
  Ellipsis,
  PackageCheck,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "@lucide/vue";
import { useUserStore } from "@/stores/users.ts";

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent]);

const { isDark } = inject<{ isDark: Ref<boolean> }>("theme")!;
const { t } = useI18n();
const userStore = useUserStore();

interface Metric {
  id: string;
  label: string;
  value: string;
  trend: number;
  icon: Component;
  color: string;
  background: string;
}

const metrics = computed<Metric[]>(() => [
  {
    id: "sales",
    label: t("home.metrics.sales"),
    value: "¥128,560",
    trend: 12.5,
    icon: CircleDollarSign,
    color: "#165dff",
    background: "#e8f3ff",
  },
  {
    id: "orders",
    label: t("home.metrics.orders"),
    value: "1,284",
    trend: 8.2,
    icon: ShoppingCart,
    color: "#00b42a",
    background: "#e8ffea",
  },
  {
    id: "customers",
    label: t("home.metrics.customers"),
    value: "368",
    trend: 6.4,
    icon: Users,
    color: "#722ed1",
    background: "#f5e8ff",
  },
  {
    id: "refunds",
    label: t("home.metrics.refunds"),
    value: "24",
    trend: -2.1,
    icon: PackageCheck,
    color: "#f77234",
    background: "#fff3e8",
  },
]);

const axisColor = computed(() => (isDark.value ? "#6b7785" : "#c9cdd4"));
const labelColor = computed(() => (isDark.value ? "#a9aeb8" : "#86909c"));
const splitLineColor = computed(() => (isDark.value ? "rgba(255,255,255,.07)" : "#f2f3f5"));

const salesOption = computed(() => ({
  animationDuration: 800,
  tooltip: {
    trigger: "axis",
    backgroundColor: isDark.value ? "#2c2c32" : "#ffffff",
    borderWidth: 0,
    textStyle: { color: isDark.value ? "#f2f3f5" : "#1d2129" },
  },
  grid: { top: 26, right: 18, bottom: 10, left: 4, containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: [
      t("home.weekdays.monday"),
      t("home.weekdays.tuesday"),
      t("home.weekdays.wednesday"),
      t("home.weekdays.thursday"),
      t("home.weekdays.friday"),
      t("home.weekdays.saturday"),
      t("home.weekdays.sunday"),
    ],
    axisTick: { show: false },
    axisLine: { lineStyle: { color: axisColor.value } },
    axisLabel: { color: labelColor.value, margin: 14 },
  },
  yAxis: [
    {
      type: "value",
      min: 0,
      max: 160,
      interval: 40,
      axisLabel: { color: labelColor.value, formatter: "¥{value}k" },
      splitLine: { lineStyle: { color: splitLineColor.value } },
    },
    {
      type: "value",
      min: 0,
      max: 1600,
      show: false,
    },
  ],
  series: [
    {
      name: t("home.salesAmount"),
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 7,
      showSymbol: false,
      data: [62, 78, 71, 96, 112, 126, 142],
      lineStyle: { width: 3, color: "#165dff" },
      itemStyle: { color: "#165dff", borderColor: "#fff", borderWidth: 2 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(22, 93, 255, .28)" },
            { offset: 1, color: "rgba(22, 93, 255, 0)" },
          ],
        },
      },
    },
    {
      name: t("home.orderCount"),
      type: "line",
      yAxisIndex: 1,
      smooth: true,
      symbol: "circle",
      symbolSize: 7,
      showSymbol: false,
      data: [580, 760, 690, 930, 1070, 1200, 1360],
      lineStyle: { width: 2, color: "#14c9c9", type: "dashed" },
      itemStyle: { color: "#14c9c9" },
    },
  ],
}));

const sourceData = computed(() => [
  { value: 42, name: t("home.sources.miniProgram"), itemStyle: { color: "#165dff" } },
  { value: 28, name: t("home.sources.website"), itemStyle: { color: "#14c9c9" } },
  { value: 18, name: t("home.sources.store"), itemStyle: { color: "#722ed1" } },
  { value: 12, name: t("home.sources.other"), itemStyle: { color: "#f7ba1e" } },
]);

const sourceOption = computed(() => ({
  tooltip: { trigger: "item", formatter: "{b}<br/>{c}%" },
  series: [
    {
      type: "pie",
      radius: ["62%", "84%"],
      center: ["50%", "50%"],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: "center",
        formatter: `1,284\n{total|${t("home.totalOrders")}}`,
        color: isDark.value ? "#f2f3f5" : "#1d2129",
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 28,
        rich: { total: { color: labelColor.value, fontSize: 12, fontWeight: 400, lineHeight: 20 } },
      },
      labelLine: { show: false },
      data: sourceData.value,
      itemStyle: { borderColor: isDark.value ? "#18181c" : "#fff", borderWidth: 4, borderRadius: 8 },
    },
  ],
}));

const channelOption = computed(() => ({
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { top: 18, right: 12, bottom: 8, left: 4, containLabel: true },
  xAxis: {
    type: "category",
    data: [
      t("home.channels.organicSearch"),
      t("home.channels.paidPromotion"),
      t("home.channels.socialMedia"),
      t("home.channels.direct"),
      t("home.channels.partners"),
    ],
    axisTick: { show: false },
    axisLine: { lineStyle: { color: axisColor.value } },
    axisLabel: { color: labelColor.value, margin: 13 },
  },
  yAxis: {
    type: "value",
    axisLabel: { color: labelColor.value, formatter: "{value}%" },
    splitLine: { lineStyle: { color: splitLineColor.value } },
  },
  series: [
    {
      name: t("home.conversionRate"),
      type: "bar",
      barWidth: 24,
      data: [68, 52, 46, 63, 38],
      itemStyle: { color: "#4080ff", borderRadius: [6, 6, 0, 0] },
    },
  ],
}));

const recentOrders = computed(() => [
  {
    id: "#SO2026080901",
    customer: t("home.orders.first.customer"),
    product: t("home.orders.first.product"),
    amount: "2,999",
    status: t("home.status.completed"),
    statusType: "success",
    avatarColor: "#e8f3ff",
  },
  {
    id: "#SO2026080902",
    customer: t("home.orders.second.customer"),
    product: t("home.orders.second.product"),
    amount: "1,688",
    status: t("home.status.processing"),
    statusType: "pending",
    avatarColor: "#f5e8ff",
  },
  {
    id: "#SO2026080903",
    customer: t("home.orders.third.customer"),
    product: t("home.orders.third.product"),
    amount: "599",
    status: t("home.status.completed"),
    statusType: "success",
    avatarColor: "#e8ffea",
  },
  {
    id: "#SO2026080904",
    customer: t("home.orders.fourth.customer"),
    product: t("home.orders.fourth.product"),
    amount: "5,899",
    status: t("home.status.pendingPayment"),
    statusType: "warning",
    avatarColor: "#fff3e8",
  },
]);
</script>

<style lang="scss" scoped>
.dashboard {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  color: var(--color-gray-10);
}

.dashboard-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;

  h1 {
    margin: 4px 0 6px;
    font-size: clamp(24px, 2vw, 30px);
    line-height: 1.25;
  }
}

.eyebrow,
.subtitle,
.panel-heading p {
  margin: 0;
  color: var(--color-gray-6);
}

.eyebrow {
  color: var(--color-primary-6);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.subtitle {
  font-size: 14px;
}

.updated-at {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
  color: var(--color-gray-6);
  font-size: 13px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success-6);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-success-6) 14%, transparent);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.metric-card,
.panel {
  border-radius: 12px;
  background: var(--color-bg-container);
}

.metric-card {
  padding: 20px;

  strong {
    display: block;
    margin: 14px 0 12px;
    font-size: 27px;
    line-height: 1;
    letter-spacing: -0.02em;
  }
}

.metric-card__top,
.metric-card__footer,
.panel-heading,
.source-legend div,
.source-legend span,
.text-button {
  display: flex;
  align-items: center;
}

.metric-card__top {
  justify-content: space-between;
  color: var(--color-gray-7);
  font-size: 14px;
}

.metric-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
}

.metric-card__footer {
  gap: 7px;
  color: var(--color-gray-5);
  font-size: 12px;
}

.trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
}

.trend--up {
  color: var(--color-success-6);
}
.trend--down {
  color: var(--color-error-6);
}

.chart-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-grid--primary {
  grid-template-columns: minmax(0, 1.75fr) minmax(320px, 0.75fr);
}
.chart-grid--secondary {
  grid-template-columns: minmax(0, 1fr) minmax(440px, 1fr);
}

.panel {
  min-width: 0;
  padding: 20px;
}

.panel-heading {
  min-height: 42px;
  justify-content: space-between;
  gap: 20px;

  h2 {
    margin: 0 0 5px;
    font-size: 16px;
  }

  p {
    font-size: 12px;
  }
}

.legend-summary {
  display: flex;
  gap: 18px;
  color: var(--color-gray-6);
  font-size: 12px;

  span {
    white-space: nowrap;
  }
}

.legend-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  border-radius: 50%;
}

.legend-dot--blue {
  background: #165dff;
}
.legend-dot--cyan {
  background: #14c9c9;
}

.more-button,
.text-button {
  border: 0;
  color: var(--color-gray-6);
  background: transparent;
  cursor: pointer;
}

.more-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 7px;

  &:hover {
    background: var(--color-gray-2);
  }
}

.text-button {
  gap: 2px;
  padding: 0;
  color: var(--color-primary-6);
  font-size: 12px;
}

.chart {
  width: 100%;
}
.chart--trend {
  height: 280px;
  margin-top: 8px;
}
.chart--pie {
  height: 196px;
  margin-top: 4px;
}
.chart--bar {
  height: 252px;
  margin-top: 8px;
}

.source-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 20px;
  padding-top: 10px;

  div {
    justify-content: space-between;
    color: var(--color-gray-7);
    font-size: 12px;
  }

  span {
    gap: 7px;
  }

  i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  strong {
    color: var(--color-gray-9);
  }
}

.order-list {
  margin-top: 11px;
}

.order-row {
  display: grid;
  grid-template-columns: 36px minmax(120px, 1.2fr) minmax(100px, 1fr) 76px 58px;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-gray-3) 70%, transparent);
  font-size: 12px;

  &:last-child {
    border-bottom: 0;
  }
}

.customer-avatar {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 9px;
  color: #165dff;
  font-weight: 600;
}

.order-customer {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;

  strong {
    font-size: 13px;
  }
  span {
    color: var(--color-gray-5);
  }
}

.order-product {
  overflow: hidden;
  color: var(--color-gray-7);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-amount {
  font-weight: 600;
}

.order-status {
  padding: 3px 7px;
  border-radius: 5px;
  text-align: center;
}

.order-status--success {
  color: var(--color-success-7);
  background: var(--color-success-1);
}
.order-status--pending {
  color: var(--color-primary-7);
  background: var(--color-primary-1);
}
.order-status--warning {
  color: var(--color-warning-7);
  background: var(--color-warning-1);
}

@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-grid--primary,
  .chart-grid--secondary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
  .metric-card {
    padding: 17px;
  }
  .panel {
    padding: 16px;
  }
  .legend-summary {
    display: none;
  }
  .chart--trend {
    height: 240px;
  }
  .source-legend {
    grid-template-columns: 1fr;
  }
  .order-row {
    grid-template-columns: 34px 1fr auto;
  }
  .order-product,
  .order-amount {
    display: none;
  }
}
</style>
