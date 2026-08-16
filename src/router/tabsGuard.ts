import type { Router } from "vue-router";
import store from "@/stores";
import { useTabsStore } from "@/stores/tabs.ts";

/** 注册页签记录守卫：业务页面导航完成后登记页签并纳入 keep-alive 缓存。 */
export function tabsGuard(router: Router) {
  router.afterEach(to => {
    useTabsStore(store).addTab(to);
  });
}
