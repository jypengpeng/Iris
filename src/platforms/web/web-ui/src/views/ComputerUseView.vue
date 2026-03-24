<template>
  <main class="cu-area">
    <section class="cu-frame">
      <header class="cu-topbar">
        <div class="cu-topbar-main">
          <span class="cu-kicker">Computer Use</span>
          <h2>Computer Use</h2>
          <p>启用浏览器或桌面自动化能力，让 AI 可以操作屏幕完成复杂任务。</p>
        </div>
      </header>

      <div class="cu-body">
        <div v-if="loading" class="settings-section" style="text-align:center;padding:32px">加载中...</div>
        <template v-else>
          <section class="settings-section">
            <div class="settings-switch-row">
              <div>
                <span class="switch-label">启用 Computer Use</span>
                <p class="field-hint">开启后 AI 将能使用浏览器或桌面截图与操作工具。</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="computerUse.enabled" />
                <span class="toggle-switch-ui"></span>
              </label>
            </div>

            <template v-if="computerUse.enabled">
              <div class="settings-grid two-columns" style="margin-top:12px">
                <div class="form-group">
                  <label>执行环境</label>
                  <AppSelect v-model="computerUse.environment" :options="cuEnvironmentOptions" />
                  <p class="field-hint">browser 使用 Playwright 浏览器；screen 使用系统桌面截图与鼠标键盘。</p>
                </div>
                <div class="form-group">
                  <label>截图格式</label>
                  <AppSelect v-model="computerUse.screenshotFormat" :options="cuScreenshotFormatOptions" />
                </div>
                <div class="form-group">
                  <label>视口宽度</label>
                  <input type="number" :value="computerUse.screenWidth" placeholder="1440" min="100" @input="handleStringNumberInput(computerUse, 'screenWidth', $event)" />
                </div>
                <div class="form-group">
                  <label>视口高度</label>
                  <input type="number" :value="computerUse.screenHeight" placeholder="900" min="100" @input="handleStringNumberInput(computerUse, 'screenHeight', $event)" />
                </div>
                <div class="form-group">
                  <label>截图质量</label>
                  <input type="number" :value="computerUse.screenshotQuality" placeholder="仅 JPEG 格式有效 (1-100)" min="1" max="100" @input="handleStringNumberInput(computerUse, 'screenshotQuality', $event)" />
                </div>
                <div class="form-group">
                  <label>保留截图轮次</label>
                  <input type="number" :value="computerUse.maxRecentScreenshots" placeholder="3" min="1" @input="handleStringNumberInput(computerUse, 'maxRecentScreenshots', $event)" />
                </div>
                <div class="form-group">
                  <label>操作后延迟（ms）</label>
                  <input type="number" :value="computerUse.postActionDelay" placeholder="无延迟" min="0" @input="handleStringNumberInput(computerUse, 'postActionDelay', $event)" />
                </div>
              </div>

              <!-- browser 环境特有字段 -->
              <template v-if="computerUse.environment === 'browser'">
                <label class="settings-sub-label" style="margin-top:16px">浏览器环境设置</label>
                <div class="settings-grid two-columns">
                  <div class="settings-switch-row">
                    <div>
                      <span class="switch-label">无头模式</span>
                      <p class="field-hint">不弹出浏览器窗口，在后台运行。</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="computerUse.headless" />
                      <span class="toggle-switch-ui"></span>
                    </label>
                  </div>
                  <div class="settings-switch-row">
                    <div>
                      <span class="switch-label">高亮鼠标指针</span>
                      <p class="field-hint">在截图中标记鼠标位置。</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="computerUse.highlightMouse" />
                      <span class="toggle-switch-ui"></span>
                    </label>
                  </div>
                  <div class="form-group full-width">
                    <label>初始 URL</label>
                    <input type="text" v-model="computerUse.initialUrl" placeholder="https://example.com" />
                    <p class="field-hint">浏览器启动时打开的页面。</p>
                  </div>
                  <div class="form-group full-width">
                    <label>搜索引擎 URL</label>
                    <input type="text" v-model="computerUse.searchEngineUrl" placeholder="https://www.google.com/search?q=" />
                  </div>
                </div>
              </template>

              <!-- screen 环境特有字段 -->
              <template v-if="computerUse.environment === 'screen'">
                <label class="settings-sub-label" style="margin-top:16px">桌面环境设置</label>
                <div class="settings-grid two-columns">
                  <div class="form-group full-width">
                    <label>目标窗口标题</label>
                    <input type="text" v-model="computerUse.targetWindow" placeholder="子字符串匹配（可选）" />
                    <p class="field-hint">指定后仅截取包含该标题的窗口。</p>
                  </div>
                  <div class="settings-switch-row">
                    <div>
                      <span class="switch-label">后台模式</span>
                      <p class="field-hint">不将窗口置于前台。</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="computerUse.backgroundMode" />
                      <span class="toggle-switch-ui"></span>
                    </label>
                  </div>
                </div>
              </template>

              <!-- 环境工具策略 -->
              <div class="tier-block" style="margin-top:16px">
                <div class="tier-header" @click="cuToolPolicyOpen = !cuToolPolicyOpen">
                  <span class="tier-arrow" :class="{ open: cuToolPolicyOpen }"></span>
                  <span class="tier-label">环境工具策略</span>
                  <span class="tier-desc">控制不同环境下可用的工具</span>
                </div>
                <div v-show="cuToolPolicyOpen" class="tier-body">
                  <div v-for="envKey in cuEnvToolKeys" :key="envKey.key" style="margin-bottom:16px">
                    <label class="settings-sub-label">{{ envKey.label }}</label>
                    <div class="settings-grid two-columns">
                      <div class="form-group">
                        <label>工具策略</label>
                        <AppSelect v-model="computerUse[envKey.modeKey]" :options="cuToolModeOptions" />
                      </div>
                      <div class="form-group full-width" v-if="computerUse[envKey.modeKey] !== 'all'">
                        <label>{{ computerUse[envKey.modeKey] === 'include' ? '工具白名单' : '工具黑名单' }}（每行一个）</label>
                        <textarea v-model="computerUse[envKey.listKey]" rows="3" placeholder="computer_screenshot&#10;computer_click&#10;..."></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </section>
        </template>
      </div>

      <footer class="cu-footer">
        <span v-if="saving" class="settings-status">自动保存中...</span>
        <span v-else-if="statusError" class="settings-status error">{{ statusText }}</span>
        <span v-else class="settings-status">已自动保存</span>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import AppSelect from '../components/AppSelect.vue'
import { getConfig, updateConfig } from '../api/client'

const loading = ref(true)
const saving = ref(false)
const statusText = ref('')
const statusError = ref(false)
const cuToolPolicyOpen = ref(false)

const computerUse = reactive({
  enabled: false,
  environment: 'browser' as string,
  screenWidth: '',
  screenHeight: '',
  postActionDelay: '',
  screenshotFormat: 'png' as string,
  screenshotQuality: '',
  headless: false,
  initialUrl: '',
  searchEngineUrl: '',
  highlightMouse: false,
  targetWindow: '',
  backgroundMode: false,
  maxRecentScreenshots: '',
  envToolBrowserMode: 'all' as string,
  envToolBrowserList: '',
  envToolScreenMode: 'all' as string,
  envToolScreenList: '',
  envToolBackgroundMode: 'all' as string,
  envToolBackgroundList: '',
})

const cuEnvironmentOptions = [
  { value: 'browser', label: 'Browser', description: '使用 Playwright 浏览器' },
  { value: 'screen', label: 'Screen', description: '使用系统桌面截图与鼠标键盘' },
]
const cuScreenshotFormatOptions = [
  { value: 'png', label: 'PNG', description: '无损格式' },
  { value: 'jpeg', label: 'JPEG', description: '有损压缩，体积更小' },
]
const cuToolModeOptions = [
  { value: 'all', label: '全部工具', description: '不限制' },
  { value: 'include', label: '白名单', description: '仅允许指定工具' },
  { value: 'exclude', label: '黑名单', description: '排除指定工具' },
]
const cuEnvToolKeys = [
  { key: 'browser', label: 'Browser 环境', modeKey: 'envToolBrowserMode' as const, listKey: 'envToolBrowserList' as const },
  { key: 'screen', label: 'Screen 环境', modeKey: 'envToolScreenMode' as const, listKey: 'envToolScreenList' as const },
  { key: 'background', label: 'Background 环境', modeKey: 'envToolBackgroundMode' as const, listKey: 'envToolBackgroundList' as const },
]

function handleStringNumberInput(target: Record<string, any>, key: string, event: Event) {
  target[key] = (event.target as HTMLInputElement).value
}

function loadComputerUseFromData(data: any) {
  if (!data.computer_use || typeof data.computer_use !== 'object') return
  const cu = data.computer_use
  computerUse.enabled = !!cu.enabled
  computerUse.environment = cu.environment === 'screen' ? 'screen' : 'browser'
  computerUse.screenWidth = cu.screenWidth != null ? String(cu.screenWidth) : ''
  computerUse.screenHeight = cu.screenHeight != null ? String(cu.screenHeight) : ''
  computerUse.postActionDelay = cu.postActionDelay != null ? String(cu.postActionDelay) : ''
  computerUse.screenshotFormat = cu.screenshotFormat === 'jpeg' ? 'jpeg' : 'png'
  computerUse.screenshotQuality = cu.screenshotQuality != null ? String(cu.screenshotQuality) : ''
  computerUse.headless = !!cu.headless
  computerUse.initialUrl = cu.initialUrl || ''
  computerUse.searchEngineUrl = cu.searchEngineUrl || ''
  computerUse.highlightMouse = !!cu.highlightMouse
  computerUse.targetWindow = cu.targetWindow || ''
  computerUse.backgroundMode = !!cu.backgroundMode
  computerUse.maxRecentScreenshots = cu.maxRecentScreenshots != null ? String(cu.maxRecentScreenshots) : ''
  if (cu.environmentTools && typeof cu.environmentTools === 'object') {
    const loadPolicy = (policy: any): { mode: string; list: string } => {
      if (!policy || typeof policy !== 'object') return { mode: 'all', list: '' }
      if (Array.isArray(policy.include) && policy.include.length > 0) return { mode: 'include', list: policy.include.join('\n') }
      if (Array.isArray(policy.exclude) && policy.exclude.length > 0) return { mode: 'exclude', list: policy.exclude.join('\n') }
      return { mode: 'all', list: '' }
    }
    const bp = loadPolicy(cu.environmentTools.browser)
    computerUse.envToolBrowserMode = bp.mode
    computerUse.envToolBrowserList = bp.list
    const sp = loadPolicy(cu.environmentTools.screen)
    computerUse.envToolScreenMode = sp.mode
    computerUse.envToolScreenList = sp.list
    const bgp = loadPolicy(cu.environmentTools.background)
    computerUse.envToolBackgroundMode = bgp.mode
    computerUse.envToolBackgroundList = bgp.list
  }
}

function buildPayload(): Record<string, any> {
  const numOrNull = (val: string | number): number | null => {
    const trimmed = String(val).trim()
    if (!trimmed) return null
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : null
  }
  const cu: Record<string, any> = {
    enabled: computerUse.enabled,
    environment: computerUse.environment,
    screenWidth: numOrNull(computerUse.screenWidth),
    screenHeight: numOrNull(computerUse.screenHeight),
    postActionDelay: numOrNull(computerUse.postActionDelay),
    screenshotFormat: computerUse.screenshotFormat,
    screenshotQuality: numOrNull(computerUse.screenshotQuality),
    headless: computerUse.headless,
    initialUrl: computerUse.initialUrl.trim() || null,
    searchEngineUrl: computerUse.searchEngineUrl.trim() || null,
    highlightMouse: computerUse.highlightMouse,
    targetWindow: computerUse.targetWindow.trim() || null,
    backgroundMode: computerUse.backgroundMode,
    maxRecentScreenshots: numOrNull(computerUse.maxRecentScreenshots),
  }
  const buildToolPolicy = (mode: string, list: string): any => {
    if (mode === 'include') return { include: list.split('\n').map(s => s.trim()).filter(Boolean), exclude: null }
    if (mode === 'exclude') return { exclude: list.split('\n').map(s => s.trim()).filter(Boolean), include: null }
    return null
  }
  const browser = buildToolPolicy(computerUse.envToolBrowserMode, computerUse.envToolBrowserList)
  const screen = buildToolPolicy(computerUse.envToolScreenMode, computerUse.envToolScreenList)
  const background = buildToolPolicy(computerUse.envToolBackgroundMode, computerUse.envToolBackgroundList)
  if (browser || screen || background) {
    cu.environmentTools = { browser, screen, background }
  } else {
    cu.environmentTools = null
  }
  return cu
}

async function handleSave() {
  if (saving.value) return
  saving.value = true
  statusText.value = ''
  statusError.value = false
  const payload = buildPayload()
  try {
    const result = await updateConfig({ computer_use: payload })
    if (result.ok) {
      lastSavedSnapshot = JSON.stringify(payload)
      statusText.value = result.restartRequired ? '已保存，需要重启生效' : '已保存并生效'
      statusError.value = false
    } else {
      statusText.value = '保存失败: ' + (result.error || '未知错误')
      statusError.value = true
    }
  } catch (err: any) {
    statusText.value = '保存失败: ' + (err instanceof Error ? err.message : '未知错误')
    statusError.value = true
  } finally {
    saving.value = false
  }
}

let configLoaded = false
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
let lastSavedSnapshot = ''

function scheduleAutoSave() {
  if (!configLoaded) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    const currentSnapshot = JSON.stringify(buildPayload())
    if (currentSnapshot === lastSavedSnapshot) return
    if (saving.value) { scheduleAutoSave(); return }
    handleSave()
  }, 1000)
}

watch(() => JSON.stringify(computerUse), scheduleAutoSave)

async function loadData() {
  configLoaded = false
  loading.value = true
  statusText.value = ''
  statusError.value = false
  try {
    const data = await getConfig()
    loadComputerUseFromData(data)
    lastSavedSnapshot = JSON.stringify(buildPayload())
  } catch (err: any) {
    statusText.value = '加载失败: ' + (err instanceof Error ? err.message : '未知错误')
    statusError.value = true
  } finally {
    loading.value = false
    configLoaded = true
  }
}

onMounted(() => { loadData() })

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})
</script>

<style scoped>
.cu-area {
  display: flex;
  min-width: 0;
  min-height: 0;
  width: 100%;
  max-width: var(--chat-surface-max-width);
  margin: 0 auto;
}

.cu-frame {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  width: 100%;
  background: var(--surface-shell);
  border: 1px solid var(--shell-stroke);
  border-radius: var(--radius-xl);
  box-shadow: 0 30px 74px rgba(4, 8, 20, 0.34);
  backdrop-filter: blur(var(--backdrop-blur-shell));
  overflow: hidden;
  transition:
    transform var(--transition-medium),
    box-shadow var(--transition-medium),
    border-color var(--transition-medium),
    background var(--transition-slow);
}

.cu-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--shell-stroke);
}

.cu-topbar-main { flex: 1; min-width: 0; }

.cu-kicker {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.cu-topbar h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
}

.cu-topbar p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.cu-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.cu-footer {
  padding: 10px 24px;
  border-top: 1px solid var(--shell-stroke);
  text-align: right;
}
</style>
