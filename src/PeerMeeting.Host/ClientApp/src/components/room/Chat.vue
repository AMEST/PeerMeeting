<template>
  <div class="chat">
    <b-list-group class="chat-messages-list" id="chat-messages-list">
      <b-list-group-item
        href="#"
        v-for="item in this.listMessages"
        v-bind:key="item.id"
      >
        <b-avatar
          class="white-avatar message-avatar"
          :text="getInitials(item.user.name)"
          :src="item.user.avatar"
        ></b-avatar>
        <div class="message-body">
          <span class="chat-message-username" :title="item.date">
            {{ item.user.name }}
          </span>
          <br />
          <span class="chat-message-text">
            <vue-simple-markdown :source="item.text"></vue-simple-markdown>
          </span>
        </div>
      </b-list-group-item>
    </b-list-group>
    <div class="chat-textarea">
      <b-form-textarea
        v-model="messageText"
        @keyup.enter="sendMessage"
        placeholder="Write message"
      ></b-form-textarea>
    </div>
  </div>
</template>

<script>
import {
  HubConnectionBuilder,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";
import { v4 as uuidv4 } from "uuid";
import CommonUtils from "@/CommonUtils";
export default {
  name: "Chat",
  props: {
    roomId: String,
    state: Object,
  },
  data: () => ({
    connection: undefined,
    listMessages: [],
    messageText: "",
  }),
  methods: {
    sendMessage(e) {
      if (e.ctrlKey || e.shiftKey) return;
      if (this.messageText == "") return;
      this.connection.invoke(
        "SendChatMessage",
        this.messageText,
        this.roomId,
        this.$store.state.application.profile
      );
      this.messageText = "";
    },
    messageReceived: function (data) {
      var message = {
        id: uuidv4(),
        text: data.message,
        user: data.user,
        date: data.date,
      };
      this.listMessages.push(message);
      if (!this.state.chatOpened) {
        this.scrollToBottom();
        this.$store.commit("changeHasNewMessages", true);
      }
    },
    getInitials: function (username) {
      return CommonUtils.getInitials(username);
    },
    scrollToBottom: function () {
      var messagesListObject = document.getElementById("chat-messages-list");
      setTimeout(() => {
        messagesListObject.scrollTo({
          top: messagesListObject.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    },
  },
  watch: {
    // eslint-disable-next-line
    "state.chatOpened": function (n, o) {
      if (n) {
        this.$store.commit("changeHasNewMessages", false);
      }
    },
  },
  created: function () {
    var self = this;
    this.connection = new HubConnectionBuilder()
      .withUrl("/ws/chat", {
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();
    this.connection
      .start()
      .then(() =>
        self.connection.invoke(
          "JoinChat",
          self.roomId,
          self.$store.state.application.profile
        )
      );

    this.connection.on("HandleChatMessage", this.messageReceived);
  },
};
</script>
<style>
.chat {
  position: absolute;
  z-index: 60;
  height: calc(100% - 106px);
  min-width: 300px;
  left: 0;
  top: 58px;
  background-color: var(--chat-color, rgb(34, 34, 34));
  border-right: 1px solid #ced4da;
}
.chat-messages-list {
  height: calc(100% - 64px);
  width: 100%;
  position: absolute;
  left: 0;
  top: 0;
  overflow-y: scroll;
  text-align: left;
  padding-top: 10px;
  border-radius: 0px;
}
.chat-textarea {
  max-height: 64px;
  min-height: 64px;
  width: 100%;
  position: absolute;
  left: 0;
  bottom: 0;
}
.chat-textarea textarea {
  width: 100%;
  height: 64px;
  border-radius: 0px;
  resize: none;
  background-color: var(--chat-color,#303030);
  color: var(--bs-body-color);
  border-right: 1px solid var(--chat-color,#303030);
  border-left: 1px solid var(--chat-color,#303030);
  border-bottom: 1px solid var(--chat-color,#303030);
}
.chat-textarea textarea:focus {
  background-color: var(--chat-color,#303030);
  color: var(--bs-body-color);
}
.message-avatar {
  position: absolute;
  background-color: transparent;
}
.message-avatar .b-avatar-text{
      background-color: #6c757d;
}
.message-body {
  padding-left: 48px;
}
.chat-message-username {
  font-weight: bold;
  color: gray;
  font-size: small;
}
.chat-message-text {
  white-space: pre-wrap;
  word-break: break-word;
}
.markdown-body {
  color: var(--bs-body-color);
}

.markdown-body pre {
  background-color: var(--bs-body-bg);
}
@-moz-document url-prefix() {
  .markdown-body::before {
    content: unset !important;
  }
  .markdown-body::after {
    content: unset !important;
  }
}
</style>