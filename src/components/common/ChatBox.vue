<template>
  <div class="chatBox">
    <!-- 悬浮图标 -->
    <div class="chatBoxIcon" @click="openChat">
      <el-badge :value="totalUnreadCount" :hidden="totalUnreadCount === 0" :max="99">
        <el-icon :color="iconColor" size="26"><Message /></el-icon>
      </el-badge>
    </div>

    <!-- 透明蒙层 + 弹窗 -->
    <transition name="fade">
      <div v-if="visible" class="mask-layer" @click="closeChat"></div>
    </transition>

    <transition name="slide-fade">
      <div v-if="visible" class="box-container">
        <!-- 关闭按钮 -->
        <div class="close-btn" @click="closeChat">
          <el-icon><Close /></el-icon>
        </div>

        <!-- 左侧会话列表 -->
        <div class="user-list" v-if="isAdmin">
          <div class="user-title"><span>用户会话</span></div>
          <div class="user-items" v-loading="loadingConversations">
            <div
                v-for="conv in conversations"
                :key="conv.id"
                class="user-item"
                :class="{ active: currentConversationId === conv.id }"
                @click="selectConversation(conv)"
            >
              <div class="user-avatar">
                {{ getOtherParticipantName(conv).charAt(0) }}
              </div>
              <div class="conv-info">
                <div class="conv-name">{{ getOtherParticipantName(conv) }}</div>
                <div class="conv-last-msg">{{ conv.lastMessage || '暂无消息' }}</div>
              </div>
              <el-badge
                  v-if="getUnreadCount(conv.id) > 0"
                  :value="getUnreadCount(conv.id)"
                  class="user-badge"
              />
            </div>
            <div v-if="conversations.length === 0" class="empty-tip">暂无会话</div>
          </div>
        </div>

        <!-- 右侧聊天区域 -->
        <div class="chat-container">
          <div class="chat-header">
            {{ currentConversation ? getOtherParticipantName(currentConversation) : '请选择会话' }}
            <el-button
                v-if="currentConversation"
                type="danger"
                size="small"
                style="float: right; margin-top: -3px;"
                @click="closeCurrentConversation"
            >关闭会话</el-button>
          </div>
          <div class="chat-messages" ref="messagesContainer">
            <div
                v-for="msg in messages"
                :key="msg.id"
                class="message-item"
                :class="{
                  'message-self': msg.userId === currentUserId,
                  'message-other': msg.userId !== currentUserId
                }"
            >
              <div class="message-header">
                <span class="message-user">用户 {{ msg.userId }}</span>
                <span class="message-time">{{ formatTime(msg.time) }}</span>
              </div>
              <div class="message-body">
                {{ msg.text }}
              </div>
            </div>
            <div v-if="loadingMessages" class="empty-tip">加载中...</div>
            <div v-else-if="messages.length === 0" class="empty-tip">暂无消息，开始聊天吧</div>
          </div>
          <div class="chat-input">
            <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="2"
                placeholder="输入消息..."
                @keydown.ctrl.enter="sendMessage"
            />
            <el-button type="primary" @click="sendMessage">发送</el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Message, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { Client } from '@stomp/stompjs'
import { mainRequest } from '@/api'

const appStore = useAppStore()
const currentUserId = computed(() => appStore.userInfo?.id)
const isAdmin = computed(() => appStore.role === 'admin')
const token = computed(() => appStore.token)

// 状态
const visible = ref(false)
const conversations = ref([])
const currentConversationId = ref(null)
const currentConversation = ref(null)
const messages = ref([])
const inputMessage = ref('')
const loadingConversations = ref(false)
const loadingMessages = ref(false)
let stompClient = null
const unreadMap = ref(new Map())

const props = defineProps({
  iconColor: {
    type: String,
    default: 'black'
  }
})

// 总未读数
const totalUnreadCount = computed(() => {
  let total = 0
  for (let count of unreadMap.value.values()) total += count
  return total
})

// 辅助函数
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}

const getOtherParticipantName = (conv) => {
  if (!conv.userId || conv.userId.length !== 2) return '未知'
  const otherId = conv.userId[0] === currentUserId.value ? conv.userId[1] : conv.userId[0]
  return conv.otherUserName || `用户${otherId}`
}

const getUnreadCount = (convId) => unreadMap.value.get(convId) || 0
const clearUnread = (convId) => unreadMap.value.delete(convId)
const addUnread = (convId, count = 1) => {
  if (currentConversationId.value === convId) return
  const old = unreadMap.value.get(convId) || 0
  unreadMap.value.set(convId, old + count)
}

// 获取会话列表（根据角色使用不同实例）
const fetchConversations = async () => {
  loadingConversations.value = true
  try {
    let res
    if (isAdmin.value) {
      res = await mainRequest.get('/chat/admin/conversations')  // adminRequest baseURL 已包含 /api/admin，所以路径直接写 /conversations
    } else {
      res = await mainRequest.get('/chat/user/conversations')  // mainRequest baseURL 是 /api，所以路径写 /chat/user/conversations
    }
    // 注意：你的响应拦截器已经返回了 res.data，所以 res 直接就是 data 部分
    conversations.value = res || []
  } catch (error) {
    ElMessage.error(error || '获取会话列表失败')
  } finally {
    loadingConversations.value = false
  }
}

// 获取历史消息（通用接口，使用 mainRequest）
const fetchMessages = async (convId) => {
  if (!convId) return
  loadingMessages.value = true
  try {
    const res = await mainRequest.get(`/chat/messages/${convId}`)
    messages.value = res || []
    await nextTick()
    const container = document.querySelector('.chat-messages')
    if (container) container.scrollTop = container.scrollHeight
  } catch (error) {
    ElMessage.error(error||'获取消息失败')
  } finally {
    loadingMessages.value = false
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  if (!currentConversationId.value && isAdmin.value) {
    ElMessage.warning('请先选择一个会话')
    return
  }
  const content = inputMessage.value.trim()
  inputMessage.value = ''
  // 乐观更新UI
  const tempId = Date.now()
  const tempMsg = {
    id: tempId,
    conversationId: currentConversationId.value || null,
    userId: currentUserId.value,
    text: content,
    type: 1,
    time: new Date().toISOString(),
    status: 'sending'
  }
  messages.value.push(tempMsg)
  await nextTick()
  const container = document.querySelector('.chat-messages')
  if (container) container.scrollTop = container.scrollHeight

  try {
    let res;
    if (isAdmin.value) {
      res = await mainRequest.post('/chat/admin/send', {
        conversationId: currentConversationId.value,
        adminId: currentUserId.value,
        type: 1,
        content:content
      })
    } else {
      res = await mainRequest.post('/chat/user/send', {
        id: currentUserId.value,
        conversationId: currentConversationId.value,
        type: 1,
        content:content
      })
    }
    // 删除临时消息
    const index = messages.value.findIndex(m => m.id === tempId);
    if (index !== -1) messages.value.splice(index, 1);

    // 普通用户首次发送，接口返回新会话ID
    if (!currentConversationId.value && !isAdmin.value) {
      currentConversationId.value = res;  // 接口返回的会话ID
      await fetchConversations();
      const newConv = conversations.value.find(c => c.id === currentConversationId.value);
      if (newConv) currentConversation.value = newConv;
    }

    // 刷新消息列表
    await fetchMessages(currentConversationId.value);
  } catch (error) {
    // 发送失败，删除临时消息并提示
    const index = messages.value.findIndex(m => m.id === tempId)
    if (index !== -1) messages.value.splice(index, 1)
    ElMessage.error(error||'发送消息失败')
  }
}

// 选择会话
const selectConversation = async (conv) => {
  if (currentConversationId.value === conv.id) return
  currentConversationId.value = conv.id
  currentConversation.value = conv
  clearUnread(conv.id)
  await fetchMessages(conv.id)
}

// 关闭会话
const closeCurrentConversation = async () => {
  if (!currentConversationId.value) return
  try {
    await mainRequest.delete(`/chat/conversation/${currentConversationId.value}/close`, {
      params: { operatorId: currentUserId.value }
    })
    ElMessage.success('会话已关闭')
    conversations.value = conversations.value.filter(c => c.id !== currentConversationId.value)
    currentConversationId.value = null
    currentConversation.value = null
    messages.value = []
    unreadMap.value.delete(currentConversationId.value)
  } catch (error) {
    ElMessage.error(error||'关闭会话失败')
  }
}

// WebSocket 连接（与 AdminLayout 保持一致）
const connectWebSocket = () => {
  if (!token.value || !currentUserId.value) return
  // 将 token 作为 URL 参数
  const wsUrl = `ws://localhost:8080/api/ws?token=${token.value}`
  stompClient = new Client({
    brokerURL: wsUrl,   // 直接带参数
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (str) => console.log(str),
    onConnect: () => {
      stompClient.subscribe(`/queue/messages/${currentUserId.value}`, (message) => {
        const newMsg = JSON.parse(message.body)
        handleNewMessage(newMsg)
      });

      stompClient.subscribe(`/queue/conversation-closed/${currentUserId.value}`, (message) => {
        const closedConvId = JSON.parse(message.body);
        conversations.value = conversations.value.filter(c => c.id !== closedConvId);
        if (currentConversationId.value === closedConvId) {
          currentConversationId.value = null;
          currentConversation.value = null;
          messages.value = [];
        }
        ElMessage.info('对方已关闭会话');
      });
    },
    onStompError: (frame) => {
      console.error('Chat STOMP error', frame)
    }
  })
  stompClient.activate()
}

// 处理实时消息
const handleNewMessage = (msg) => {
  const convId = msg.conversationId
  if (currentConversationId.value === convId) {
    messages.value.push(msg)
    nextTick(() => {
      const container = document.querySelector('.chat-messages')
      if (container) container.scrollTop = container.scrollHeight
    })
    clearUnread(convId)
  } else {
    addUnread(convId, 1)
    const conv = conversations.value.find(c => c.id === convId)
    if (conv) conv.lastMessage = msg.text
  }
  // 若会话列表中不存在该会话，刷新列表
  if (!conversations.value.some(c => c.id === convId)) {
    fetchConversations()
  }
}

// 打开/关闭窗口
const openChat = async () => {
  visible.value = true
  await fetchConversations()
  if (conversations.value.length > 0 && !currentConversationId.value) {
    selectConversation(conversations.value[0])
  }
}
const closeChat = () => { visible.value = false }

onMounted(() => {
  connectWebSocket()
})
onUnmounted(() => {
  if (stompClient) stompClient.deactivate()
})

defineExpose({ reconnect: connectWebSocket })
</script>


<style scoped>
.chatBox {
  z-index: 2000;
}
.chatBoxIcon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.chatBoxIcon:hover {
  transform: scale(1.08);
}
.chatBoxIcon .el-badge {
  display: flex;
}
.mask-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  z-index: 9998;
  pointer-events: auto;
}
.box-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  width: 900px;
  max-width: 95vw;
  height: 650px;
  max-height: 90vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  overflow: hidden;
}
.user-list {
  width: 220px;
  background: #2a3b4c;
  color: white;
  display: flex;
  flex-direction: column;
}
.user-title {
  padding: 18px 15px;
  background: #1f2d3d;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}
.user-items {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.user-item {
  padding: 12px 15px;
  margin-bottom: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}
.user-item:hover {
  background: #3f5367;
}
.user-item.active {
  background: #007bff;
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.user-badge {
  margin-left: auto;
}
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  position: relative;
}
.chat-container.full-width {
  width: 100%;
}
.chat-header {
  padding: 15px;
  background: #007bff;
  color: white;
  font-size: 18px;
  font-weight: bold;
}
.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}
.message-wrapper {
  display: flex;
  flex-direction: column;
}
.message {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 10px;
  word-wrap: break-word;
  margin-bottom: 12px;
}
.message-receive {
  align-self: flex-start;
  background: white;
  border: 1px solid #e0e0e0;
}
.message-send {
  align-self: flex-end;
  background: #007bff;
  color: white;
}
.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}
.message-send .message-time {
  color: rgba(255, 255, 255, 0.9);
}
.send-status {
  font-size: 12px;
  color: #28a745;
  margin-left: 5px;
}
.empty-tip {
  text-align: center;
  color: #aaa;
  margin-top: 40px;
}
.chat-input {
  display: flex;
  padding: 10px 15px;
  background: white;
  border-top: 1px solid #e0e0e0;
  gap: 8px;
  align-items: center;
}
.chat-input .el-input {
  flex: 1;
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
  z-index: 10;
}
.close-btn:hover {
  background: rgba(0, 0, 0, 0.5);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.conv-info {
  flex: 1;
  margin-left: 8px;
  overflow: hidden;
}
.conv-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conv-last-msg {
  font-size: 12px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-item.active .conv-last-msg {
  color: rgba(255,255,255,0.8);
}
.message-item {
  margin-bottom: 16px;
  max-width: 75%;
}
.message-self {
  margin-left: auto;
  text-align: right;
}
.message-other {
  margin-right: auto;
  text-align: left;
}
.message-header {
  font-size: 12px;
  margin-bottom: 4px;
  display: flex;
  gap: 8px;
  color: #666;
}
.message-self .message-header {
  justify-content: flex-end;
}
.message-other .message-header {
  justify-content: flex-start;
}
.message-user {
  font-weight: bold;
}
.message-body {
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-block;
  word-break: break-word;
  background-color: #f0f0f0;
  text-align: left;
}
.message-self .message-body {
  background-color: #007bff;
  color: white;
}
.message-other .message-body {
  background-color: white;
  border: 1px solid #e0e0e0;
  color: #333;
}
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translate(-50%, -60%);
  opacity: 0;
}
</style>