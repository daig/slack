import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('env', {
  GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT
}) 