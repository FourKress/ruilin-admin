import { message } from 'antd'

import axios from '@/utils/axios.ts'

const uploadFile = async (file: any, objectKey: string) => {
  const size = file.type.includes('image') ? 10 : 50
  const res: Record<string, any> = await axios.post('/file/auth', {
    objectKey,
    size
  })

  const formData = new FormData()
  for (const key in res.formData) {
    formData.append(key, res.formData[key])
  }
  formData.append('file', file)

  await axios({
    method: 'post',
    url: res.postURL,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

const previewFile = async (objectKey: string) => {
  return axios.post('/file/url', {
    objectKey
  })
}

const deleteFile = async (objectKey: string) => {
  return axios.post('/file/delete', {
    objectKey
  })
}

const checkFileSize = (file: any) => {
  const isImageLt10M = file.size / 1024 / 1024 < 10
  const isVideoLt10M = file.size / 1024 / 1024 < 50
  if (file.type.includes('image')) {
    if (!isImageLt10M) {
      message.error('图片须小于 10MB !').then(() => {})
    }
    return isImageLt10M
  }
  if (!isVideoLt10M) {
    message.error('视频须小于 50MB !').then(() => {})
  }
  return isVideoLt10M
}

export { checkFileSize, deleteFile, previewFile, uploadFile }
