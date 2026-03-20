import type { ServerConfig } from '../model/types.js'
import { apiClient } from '../../../shared/api/base-client.js'

const client = apiClient<ServerConfig>('/api/server-configs')

export const serverConfigs = {
  list: client.list,
  get: client.get,
  create: client.create,
  update: client.update,
  remove: client.remove
}
