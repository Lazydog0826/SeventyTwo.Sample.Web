<template>
  <div class="dashboard">
    <section class="dashboard-heading">
      <div>
        <h1>欢迎回来，SeventyTwo</h1>
      </div>
      <div class="updated-at">
        <span class="status-dot"></span>
        更新于 10:24
      </div>
    </section>

    <section class="metric-grid">
      <article v-for="item in metrics" :key="item.label" class="metric-card">
        <div class="metric-card__top">
          <span>{{ item.label }}</span>
          <span class="metric-icon" :style="{ color: item.color, backgroundColor: item.background }">
            <component :is="item.icon" :size="19" />
          </span>
        </div>
        <strong>{{ item.value }}</strong>
        <div class="metric-card__footer">
          <span :class="['trend', item.trend > 0 ? 'trend--up' : 'trend--down']">
            <TrendingUp v-if="item.trend > 0" :size="14" />
            <TrendingDown v-else :size="14" />
            {{ Math.abs(item.trend) }}%
          </span>
          <span>较昨日</span>
        </div>
      </article>
    </section>

    <section class="chart-grid chart-grid--primary">
      <article class="panel trend-panel">
        <div class="panel-heading">
          <div>
            <h2>销售趋势</h2>
            <p>近 7 天销售额与订单量</p>
          </div>
          <div class="legend-summary">
            <span><i class="legend-dot legend-dot--blue"></i>销售额</span>
            <span><i class="legend-dot legend-dot--cyan"></i>订单量</span>
          </div>
        </div>
        <v-chart class="chart chart--trend" :option="salesOption" autoresize />
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>订单来源</h2>
            <p>各渠道订单占比</p>
          </div>
          <button class="more-button" type="button" aria-label="查看更多">
            <Ellipsis :size="20" />
          </button>
        </div>
        <v-chart class="chart chart--pie" :option="sourceOption" autoresize />
        <div class="source-legend">
          <div v-for="item in sourceData" :key="item.name">
            <span><i :style="{ backgroundColor: item.itemStyle.color }"></i>{{ item.name }}</span>
            <strong>{{ item.value }}%</strong>
          </div>
        </div>
      </article>
    </section>

    <section class="chart-grid chart-grid--secondary">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>渠道转化</h2>
            <p>本月各渠道访问与转化情况</p>
          </div>
        </div>
        <v-chart class="chart chart--bar" :option="channelOption" autoresize />
      </article>

      <article class="panel order-panel">
        <div class="panel-heading">
          <div>
            <h2>最近订单</h2>
            <p>今日最新成交记录</p>
          </div>
          <button class="text-button" type="button">查看全部 <ChevronRight :size="15" /></button>
        </div>
        <div class="order-list">
          <div v-for="order in recentOrders" :key="order.id" class="order-row">
            <div class="customer-avatar" :style="{ background: order.avatarColor }">{{ order.customer[0] }}</div>
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

<script setup lang="ts">
import { computed, inject, type Component, type Ref } from "vue";
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

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent]);

const { isDark } = inject<{ isDark: Ref<boolean> }>("theme")!;

interface Metric {
  label: string;
  value: string;
  trend: number;
  icon: Component;
  color: string;
  background: string;
}

const metrics: Metric[] = [
  {
    label: "今日销售额",
    value: "¥128,560",
    trend: 12.5,
    icon: CircleDollarSign,
    color: "#165dff",
    background: "#e8f3ff",
  },
  { label: "订单总量", value: "1,284", trend: 8.2, icon: ShoppingCart, color: "#00b42a", background: "#e8ffea" },
  { label: "新增客户", value: "368", trend: 6.4, icon: Users, color: "#722ed1", background: "#f5e8ff" },
  { label: "退款订单", value: "24", trend: -2.1, icon: PackageCheck, color: "#f77234", background: "#fff3e8" },
];

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
    data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
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
      name: "销售额",
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
      name: "订单量",
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

const sourceData = [
  { value: 42, name: "小程序", itemStyle: { color: "#165dff" } },
  { value: 28, name: "官方网站", itemStyle: { color: "#14c9c9" } },
  { value: 18, name: "线下门店", itemStyle: { color: "#722ed1" } },
  { value: 12, name: "其他渠道", itemStyle: { color: "#f7ba1e" } },
];

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
        formatter: "1,284\n{total|总订单}",
        color: isDark.value ? "#f2f3f5" : "#1d2129",
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 28,
        rich: { total: { color: labelColor.value, fontSize: 12, fontWeight: 400, lineHeight: 20 } },
      },
      labelLine: { show: false },
      data: sourceData,
      itemStyle: { borderColor: isDark.value ? "#18181c" : "#fff", borderWidth: 4, borderRadius: 8 },
    },
  ],
}));

const channelOption = computed(() => ({
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { top: 18, right: 12, bottom: 8, left: 4, containLabel: true },
  xAxis: {
    type: "category",
    data: ["自然搜索", "付费推广", "社交媒体", "直接访问", "合作渠道"],
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
      name: "转化率",
      type: "bar",
      barWidth: 24,
      data: [68, 52, 46, 63, 38],
      itemStyle: { color: "#4080ff", borderRadius: [6, 6, 0, 0] },
    },
  ],
}));

const recentOrders = [
  {
    id: "#SO2026080901",
    customer: "林晓雨",
    product: "企业专业版",
    amount: "2,999",
    status: "已完成",
    statusType: "success",
    avatarColor: "#e8f3ff",
  },
  {
    id: "#SO2026080902",
    customer: "周亦辰",
    product: "团队协作版",
    amount: "1,688",
    status: "处理中",
    statusType: "pending",
    avatarColor: "#f5e8ff",
  },
  {
    id: "#SO2026080903",
    customer: "陈知夏",
    product: "个人年度版",
    amount: "599",
    status: "已完成",
    statusType: "success",
    avatarColor: "#e8ffea",
  },
  {
    id: "#SO2026080904",
    customer: "沈星河",
    product: "企业旗舰版",
    amount: "5,899",
    status: "待付款",
    statusType: "warning",
    avatarColor: "#fff3e8",
  },
];
</script>

<style scoped lang="scss">
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
