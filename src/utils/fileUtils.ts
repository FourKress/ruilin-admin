import { message } from 'antd'

import axios from '@/utils/axios.ts'

const uploadFile = async (file: any, objectKey: string) => {
  const res: Record<string, any> = await axios.post('/file/auth', {
    objectKey
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
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('文件须小于 10MB !').then(() => {})
  }
  return isLt10M
}

export { checkFileSize, deleteFile, previewFile, uploadFile }
