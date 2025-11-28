const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("appApi", {
  ping() {
    return "pong";
  }
});
