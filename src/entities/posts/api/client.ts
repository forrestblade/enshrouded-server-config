// @generated — regenerated from valence.config.ts. DO NOT EDIT.

import type { Post } from '../model/types.js'
import { apiClient } from '../../../shared/api/base-client.js'

const client = apiClient<Post>('/api/posts')

export const posts = {
  list: client.list,
  get: client.get,
  create: client.create,
  update: client.update,
  remove: client.remove
}
