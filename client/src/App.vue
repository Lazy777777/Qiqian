<script>
import { ensureLogin, loadConfig } from './store'

export default {
  onLaunch() {
    ensureLogin().catch(() => {})
    loadConfig().catch(() => {})
  }
}
</script>

<style lang="scss">
page {
  background: $bg;
  color: $ink;
  font-size: 28rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
}

view,
text,
image,
input,
textarea,
button,
scroll-view {
  box-sizing: border-box;
}

button::after {
  border: none;
}

.card {
  background: $card;
  border-radius: $radius-lg;
}

.btn-black {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 84rpx;
  padding: 0 44rpx;
  margin: 0;
  border-radius: 999rpx;
  background: $primary;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 2rpx;
  &.small {
    height: 60rpx;
    padding: 0 28rpx;
    font-size: 26rpx;
  }
  &.ghost {
    background: transparent;
    color: $primary;
    border: 2rpx solid $primary;
  }
  &.light {
    background: $card-2;
    color: $ink;
  }
  &.danger {
    background: $danger;
  }
  &[disabled],
  &.disabled {
    background: #c5cdd5 !important;
    color: #f4f0e8 !important;
  }
}

.price {
  font-weight: 700;
  color: $ink;
  .sym {
    font-size: 0.7em;
    margin-right: 2rpx;
  }
}

.muted {
  color: $ink-3;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  padding: 8rpx 4rpx 20rpx;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 40rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  background: $card-2;
  color: $ink-2;
}

.empty {
  padding: 120rpx 0 80rpx;
  text-align: center;
  color: $ink-3;
  .empty-img {
    width: 240rpx;
    height: 240rpx;
    opacity: 0.9;
  }
  .empty-text {
    margin: 20rpx 0 36rpx;
    display: block;
  }
}

.safe-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
