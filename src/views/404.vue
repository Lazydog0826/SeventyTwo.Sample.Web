<template>
  <main class="not-found-page" :class="{ 'not-found-page--dark': isDark }">
    <section class="not-found-content">
      <div class="status-code">404</div>
      <h1>{{ t("notFound.title") }}</h1>
      <p>{{ t("notFound.description") }}</p>

      <div class="not-found-actions">
        <n-button @click="router.back()">{{ t("notFound.goBack") }}</n-button>
        <n-button type="primary" @click="router.push('/home')">{{ t("notFound.goHome") }}</n-button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { NButton } from "naive-ui";
import { inject, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();
const { isDark } = inject<{ isDark: Ref<boolean> }>("theme")!;
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  color: #1f2329;
  background: #f5f7f9;
}

.not-found-content {
  max-width: 480px;
  text-align: center;
}

.status-code {
  color: #18a058;
  font-size: 96px;
  font-weight: 700;
  line-height: 1;
}

h1 {
  margin: 24px 0 8px;
  font-size: 28px;
}

p {
  margin: 0;
  color: #646a73;
  font-size: 16px;
  line-height: 1.7;
}

.not-found-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

.not-found-page--dark {
  color: rgba(255, 255, 255, 0.9);
  background: #101014;
}

.not-found-page--dark p {
  color: rgba(255, 255, 255, 0.56);
}
</style>
