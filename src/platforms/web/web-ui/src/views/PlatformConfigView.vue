<template>
  <main class="plat-area">
    <section class="plat-frame">
      <header class="plat-topbar">
        <div class="plat-topbar-main">
          <span class="plat-kicker">Platform</span>
          <h2>平台配置</h2>
          <p>配置 Iris 运行在哪些平台上，以及各平台的连接凭证。</p>
        </div>
      </header>

      <div class="plat-body">
        <div v-if="loading" class="settings-section" style="text-align:center;padding:32px">加载中...</div>
        <template v-else>
          <section class="settings-section">
            <!-- Console -->
            <div class="tier-block">
              <div class="tier-header" @click="platformOpen.console = !platformOpen.console">
                <span class="tier-arrow" :class="{ open: platformOpen.console }"></span>
                <span class="tier-label">Console</span>
                <span class="tier-desc">终端控制台</span>
                <label class="toggle-switch tier-toggle" @click.stop>
                  <input type="checkbox" :checked="platformConfig.types.includes('console')" @change="togglePlatformType('console')" />
                  <span class="toggle-switch-ui"></span>
                </label>
              </div>
            </div>

            <!-- Web -->
            <div class="tier-block">
              <div class="tier-header" @click="platformOpen.web = !platformOpen.web">
                <span class="tier-arrow" :class="{ open: platformOpen.web }"></span>
                <span class="tier-label">Web</span>
                <span class="tier-desc">Web GUI 端口、鉴权</span>
                <label class="toggle-switch tier-toggle" @click.stop>
                  <input type="checkbox" :checked="platformConfig.types.includes('web')" @change="togglePlatformType('web')" />
                  <span class="toggle-switch-ui"></span>
                </label>
              </div>
              <div v-show="platformOpen.web" class="tier-body">
                <div class="settings-grid two-columns">
                  <div class="form-group">
                    <label>端口</label>
                    <input type="number" :value="platformConfig.web.port" placeholder="3000" min="1" max="65535" @input="handleStringNumberInput(platformConfig.web, 'port', $event)" />
                  </div>
                  <div class="form-group">
                    <label>主机</label>
                    <input type="text" v-model="platformConfig.web.host" placeholder="0.0.0.0" />
                  </div>
                  <div class="form-group full-width">
                    <label>API 访问令牌</label>
                    <input type="password" v-model="platformConfig.web.authToken" placeholder="可选" />
                    <p v-if="platformConfig.web.authToken.startsWith('****')" class="field-hint">已读取已保存值，保持不变则不会覆盖。</p>
                  </div>
                  <div class="form-group full-width">
                    <label>管理令牌</label>
                    <input type="password" v-model="platformConfig.web.managementToken" placeholder="可选" />
                    <p v-if="platformConfig.web.managementToken.startsWith('****')" class="field-hint">已读取已保存值，保持不变则不会覆盖。</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Discord -->
            <div class="tier-block">
              <div class="tier-header" @click="platformOpen.discord = !platformOpen.discord">
                <span class="tier-arrow" :class="{ open: platformOpen.discord }"></span>
                <span class="tier-label">Discord</span>
                <span class="tier-desc">Discord Bot</span>
                <label class="toggle-switch tier-toggle" @click.stop>
                  <input type="checkbox" :checked="platformConfig.types.includes('discord')" @change="togglePlatformType('discord')" />
                  <span class="toggle-switch-ui"></span>
                </label>
              </div>
              <div v-show="platformOpen.discord" class="tier-body">
                <div class="settings-grid two-columns">
                  <div class="form-group full-width">
                    <label>Bot Token</label>
                    <input type="password" v-model="platformConfig.discord.token" placeholder="Discord Bot Token" />
                    <p v-if="platformConfig.discord.token.startsWith('****')" class="field-hint">已读取已保存值，保持不变则不会覆盖。</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Telegram -->
            <div class="tier-block">
              <div class="tier-header" @click="platformOpen.telegram = !platformOpen.telegram">
                <span class="tier-arrow" :class="{ open: platformOpen.telegram }"></span>
                <span class="tier-label">Telegram</span>
                <span class="tier-desc">Telegram Bot</span>
                <label class="toggle-switch tier-toggle" @click.stop>
                  <input type="checkbox" :checked="platformConfig.types.includes('telegram')" @change="togglePlatformType('telegram')" />
                  <span class="toggle-switch-ui"></span>
                </label>
              </div>
              <div v-show="platformOpen.telegram" class="tier-body">
                <div class="settings-grid two-columns">
                  <div class="form-group full-width">
                    <label>Bot Token</label>
                    <input type="password" v-model="platformConfig.telegram.token" placeholder="Telegram Bot Token" />
                    <p v-if="platformConfig.telegram.token.startsWith('****')" class="field-hint">已读取已保存值，保持不变则不会覆盖。</p>
                  </div>
                  <div class="settings-switch-row">
                    <div>
                      <span class="switch-label">展示工具状态</span>
                      <p class="field-hint">在消息中显示工具调用状态。</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="platformConfig.telegram.showToolStatus" />
                      <span class="toggle-switch-ui"></span>
                    </label>
                  </div>
                  <div class="settings-switch-row">
                    <div>
                      <span class="switch-label">群聊需 @ 触发</span>
                      <p class="field-hint">在群组中必须 @ 机器人才会回复。</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="platformConfig.telegram.groupMentionRequired" />
                      <span class="toggle-switch-ui"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 企业微信 -->
            <div class="tier-block">
              <div class="tier-header" @click="platformOpen.wxwork = !platformOpen.wxwork">
                <span class="tier-arrow" :class="{ open: platformOpen.wxwork }"></span>
                <span class="tier-label">企业微信</span>
                <span class="tier-desc">企业微信机器人</span>
                <label class="toggle-switch tier-toggle" @click.stop>
                  <input type="checkbox" :checked="platformConfig.types.includes('wxwork')" @change="togglePlatformType('wxwork')" />
                  <span class="toggle-switch-ui"></span>
                </label>
              </div>
              <div v-show="platformOpen.wxwork" class="tier-body">
                <div class="settings-grid two-columns">
                  <div class="form-group">
                    <label>Bot ID</label>
                    <input type="text" v-model="platformConfig.wxwork.botId" placeholder="企业微信机器人 ID" />
                  </div>
                  <div class="form-group">
                    <label>Secret</label>
                    <input type="password" v-model="platformConfig.wxwork.secret" placeholder="企业微信 Secret" />
                    <p v-if="platformConfig.wxwork.secret.startsWith('****')" class="field-hint">已读取已保存值，保持不变则不会覆盖。</p>
                  </div>
                  <div class="settings-switch-row">
                    <div>
                      <span class="switch-label">展示工具状态</span>
                      <p class="field-hint">在消息中显示工具调用状态。</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="platformConfig.wxwork.showToolStatus" />
                      <span class="toggle-switch-ui"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 飞书 -->
            <div class="tier-block">
              <div class="tier-header" @click="platformOpen.lark = !platformOpen.lark">
                <span class="tier-arrow" :class="{ open: platformOpen.lark }"></span>
                <span class="tier-label">飞书</span>
                <span class="tier-desc">飞书机器人</span>
                <label class="toggle-switch tier-toggle" @click.stop>
                  <input type="checkbox" :checked="platformConfig.types.includes('lark')" @change="togglePlatformType('lark')" />
                  <span class="toggle-switch-ui"></span>
                </label>
              </div>
              <div v-show="platformOpen.lark" class="tier-body">
                <div class="settings-grid two-columns">
                  <div class="form-group">
                    <label>App ID</label>
                    <input type="text" v-model="platformConfig.lark.appId" placeholder="飞书应用 App ID" />
                  </div>
                  <div class="form-group">
                    <label>App Secret</label>
                    <input type="password" v-model="platformConfig.lark.appSecret" placeholder="飞书应用 App Secret" />
                    <p v-if="platformConfig.lark.appSecret.startsWith('****')" class="field-hint">已读取已保存值，保持不变则不会覆盖。</p>
                  </div>
                  <div class="form-group">
                    <label>Verification Token</label>
                    <input type="text" v-model="platformConfig.lark.verificationToken" placeholder="事件回调验证 Token（可选）" />
                  </div>
                  <div class="form-group">
                    <label>Encrypt Key</label>
                    <input type="text" v-model="platformConfig.lark.encryptKey" placeholder="事件回调加密 Key（可选）" />
                  </div>
                  <div class="settings-switch-row">
                    <div>
                      <span class="switch-label">展示工具状态</span>
                      <p class="field-hint">在消息中显示工具调用状态。</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="platformConfig.lark.showToolStatus" />
                      <span class="toggle-switch-ui"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- QQ -->
            <div class="tier-block">
              <div class="tier-header" @click="platformOpen.qq = !platformOpen.qq">
                <span class="tier-arrow" :class="{ open: platformOpen.qq }"></span>
                <span class="tier-label">QQ</span>
                <span class="tier-desc">QQ 机器人（OneBot）</span>
                <label class="toggle-switch tier-toggle" @click.stop>
                  <input type="checkbox" :checked="platformConfig.types.includes('qq')" @change="togglePlatformType('qq')" />
                  <span class="toggle-switch-ui"></span>
                </label>
              </div>
              <div v-show="platformOpen.qq" class="tier-body">
                <div class="settings-grid two-columns">
                  <div class="form-group full-width">
                    <label>WebSocket URL</label>
                    <input type="text" v-model="platformConfig.qq.wsUrl" placeholder="ws://127.0.0.1:8080" />
                  </div>
                  <div class="form-group">
                    <label>Access Token</label>
                    <input type="password" v-model="platformConfig.qq.accessToken" placeholder="OneBot Access Token（可选）" />
                    <p v-if="platformConfig.qq.accessToken.startsWith('****')" class="field-hint">已读取已保存值，保持不变则不会覆盖。</p>
                  </div>
                  <div class="form-group">
                    <label>Self ID</label>
                    <input type="text" v-model="platformConfig.qq.selfId" placeholder="机器人 QQ 号" />
                  </div>
                  <div class="form-group">
                    <label>群聊模式</label>
                    <AppSelect v-model="platformConfig.qq.groupMode" :options="qqGroupModeOptions" />
                    <p class="field-hint">at=需要@触发，all=所有消息触发，off=不响应群聊。</p>
                  </div>
                  <div class="settings-switch-row">
                    <div>
                      <span class="switch-label">展示工具状态</span>
                      <p class="field-hint">在消息中显示工具调用状态。</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="platformConfig.qq.showToolStatus" />
                      <span class="toggle-switch-ui"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>

      <footer class="plat-footer">
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

const platformConfig = reactive({
  types: [] as string[],
  web: { port: '', host: '', authToken: '', managementToken: '' },
  discord: { token: '' },
  telegram: { token: '', showToolStatus: false, groupMentionRequired: false },
  wxwork: { botId: '', secret: '', showToolStatus: false },
  lark: { appId: '', appSecret: '', verificationToken: '', encryptKey: '', showToolStatus: false },
  qq: { wsUrl: '', accessToken: '', selfId: '', groupMode: 'at' as string, showToolStatus: false },
})

const platformOpen = reactive({
  console: false,
  web: false,
  discord: false,
  telegram: false,
  wxwork: false,
  lark: false,
  qq: false,
})

const qqGroupModeOptions = [
  { value: 'at', label: '@ 触发', description: '群聊中需要 @ 机器人' },
  { value: 'all', label: '全部消息', description: '响应群内所有消息' },
  { value: 'off', label: '关闭', description: '不响应群聊消息' },
]

function togglePlatformType(value: string) {
  const idx = platformConfig.types.indexOf(value)
  if (idx === -1) platformConfig.types.push(value)
  else platformConfig.types.splice(idx, 1)
}

function handleStringNumberInput(target: Record<string, any>, key: string, event: Event) {
  target[key] = (event.target as HTMLInputElement).value
}

function loadPlatformFromData(data: any) {
  if (!data.platform || typeof data.platform !== 'object') return
  const pl = data.platform
  if (Array.isArray(pl.types)) platformConfig.types = [...pl.types]
  if (pl.web) {
    platformConfig.web.port = pl.web.port != null ? String(pl.web.port) : ''
    platformConfig.web.host = pl.web.host || ''
    platformConfig.web.authToken = pl.web.authToken || ''
    platformConfig.web.managementToken = pl.web.managementToken || ''
  }
  if (pl.discord) platformConfig.discord.token = pl.discord.token || ''
  if (pl.telegram) {
    platformConfig.telegram.token = pl.telegram.token || ''
    platformConfig.telegram.showToolStatus = !!pl.telegram.showToolStatus
    platformConfig.telegram.groupMentionRequired = !!pl.telegram.groupMentionRequired
  }
  if (pl.wxwork) {
    platformConfig.wxwork.botId = pl.wxwork.botId || ''
    platformConfig.wxwork.secret = pl.wxwork.secret || ''
    platformConfig.wxwork.showToolStatus = !!pl.wxwork.showToolStatus
  }
  if (pl.lark) {
    platformConfig.lark.appId = pl.lark.appId || ''
    platformConfig.lark.appSecret = pl.lark.appSecret || ''
    platformConfig.lark.verificationToken = pl.lark.verificationToken || ''
    platformConfig.lark.encryptKey = pl.lark.encryptKey || ''
    platformConfig.lark.showToolStatus = !!pl.lark.showToolStatus
  }
  if (pl.qq) {
    platformConfig.qq.wsUrl = pl.qq.wsUrl || ''
    platformConfig.qq.accessToken = pl.qq.accessToken || ''
    platformConfig.qq.selfId = pl.qq.selfId || ''
    platformConfig.qq.groupMode = pl.qq.groupMode || 'at'
    platformConfig.qq.showToolStatus = !!pl.qq.showToolStatus
  }
}

function buildPayload(): Record<string, any> {
  const p: Record<string, any> = {}
  p.types = platformConfig.types.length > 0 ? [...platformConfig.types] : null
  const web: Record<string, any> = {}
  const webPort = String(platformConfig.web.port).trim()
  web.port = webPort ? (Number(webPort) || null) : null
  web.host = platformConfig.web.host.trim() || null
  if (platformConfig.web.authToken && !platformConfig.web.authToken.startsWith('****')) {
    web.authToken = platformConfig.web.authToken
  }
  if (platformConfig.web.managementToken && !platformConfig.web.managementToken.startsWith('****')) {
    web.managementToken = platformConfig.web.managementToken
  }
  p.web = web
  const discord: Record<string, any> = {}
  if (platformConfig.discord.token && !platformConfig.discord.token.startsWith('****')) {
    discord.token = platformConfig.discord.token
  }
  p.discord = discord
  const telegram: Record<string, any> = {
    showToolStatus: platformConfig.telegram.showToolStatus,
    groupMentionRequired: platformConfig.telegram.groupMentionRequired,
  }
  if (platformConfig.telegram.token && !platformConfig.telegram.token.startsWith('****')) {
    telegram.token = platformConfig.telegram.token
  }
  p.telegram = telegram
  const wxwork: Record<string, any> = {
    botId: platformConfig.wxwork.botId.trim() || null,
    showToolStatus: platformConfig.wxwork.showToolStatus,
  }
  if (platformConfig.wxwork.secret && !platformConfig.wxwork.secret.startsWith('****')) {
    wxwork.secret = platformConfig.wxwork.secret
  }
  p.wxwork = wxwork
  const lark: Record<string, any> = {
    appId: platformConfig.lark.appId.trim() || null,
    verificationToken: platformConfig.lark.verificationToken.trim() || null,
    encryptKey: platformConfig.lark.encryptKey.trim() || null,
    showToolStatus: platformConfig.lark.showToolStatus,
  }
  if (platformConfig.lark.appSecret && !platformConfig.lark.appSecret.startsWith('****')) {
    lark.appSecret = platformConfig.lark.appSecret
  }
  p.lark = lark
  const qq: Record<string, any> = {
    wsUrl: platformConfig.qq.wsUrl.trim() || null,
    selfId: platformConfig.qq.selfId.trim() || null,
    groupMode: platformConfig.qq.groupMode || null,
    showToolStatus: platformConfig.qq.showToolStatus,
  }
  if (platformConfig.qq.accessToken && !platformConfig.qq.accessToken.startsWith('****')) {
    qq.accessToken = platformConfig.qq.accessToken
  }
  p.qq = qq
  return p
}

async function handleSave() {
  if (saving.value) return
  saving.value = true
  statusText.value = ''
  statusError.value = false
  try {
    const result = await updateConfig({ platform: buildPayload() })
    if (result.ok) {
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

function scheduleAutoSave() {
  if (!configLoaded) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (saving.value) { scheduleAutoSave(); return }
    handleSave()
  }, 1000)
}

watch(() => JSON.stringify(platformConfig), scheduleAutoSave)

async function loadData() {
  configLoaded = false
  loading.value = true
  statusText.value = ''
  statusError.value = false
  try {
    const data = await getConfig()
    loadPlatformFromData(data)
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
.plat-area {
  display: flex;
  min-width: 0;
  min-height: 0;
  width: 100%;
  max-width: var(--chat-surface-max-width);
  margin: 0 auto;
}

.plat-frame {
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

.plat-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--shell-stroke);
}

.plat-topbar-main { flex: 1; min-width: 0; }

.plat-kicker {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.plat-topbar h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
}

.plat-topbar p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.plat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.plat-footer {
  padding: 10px 24px;
  border-top: 1px solid var(--shell-stroke);
  text-align: right;
}
</style>
