import type { Router } from "vue-router";
import { BProgress } from "@bprogress/core";

BProgress.configure({
  showSpinner: false,
});

/** 注册导航进度条钩子，覆盖导航开始、完成及异常场景。 */
export function routeProgress(router: Router) {
  router.beforeEach((_to, _from, next) => {
    BProgress.start();
    return next();
  });

  router.afterEach(() => {
    BProgress.done();
  });

  router.onError(() => {
    BProgress.done();
  });
}
