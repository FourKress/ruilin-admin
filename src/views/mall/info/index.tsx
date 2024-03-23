import { FC, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormItem,
  ProFormText
} from '@ant-design/pro-components'
import { Button, Col, Descriptions, Form, Image, message, Row, Upload } from 'antd'

import axios from '@/utils/axios.ts'
import { checkFileSize, uploadFile } from '@/utils/fileUtils.ts'

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const { perms = [] } = userInfo
console.log(perms)

const Info: FC<Record<string, any>> = () => {
  const [fileList, setFileList] = useState<any>([])
  const [form] = Form.useForm()
  const [previewInfo, setPreviewInfo] = useState({
    visible: false,
    url: ''
  })

  const [loading, setLoading] = useState<boolean>(false)

  return (
    <PageContainer
      breadcrumbRender={false}
      header={{
        title: '基本信息'
      }}
    >
      <Row>
        <Col span={24}>
          <ProForm
            form={form}
            layout={'horizontal'}
            request={async () => {
              const res: any = await axios.get(`/mall/details`)
              if (!res?.id) return {}

              const newFileList = [
                {
                  id: res.id,
                  uid: res.uid,
                  name: res.fileName,
                  type: res.fileType,
                  status: 'done',
                  url: `https://assets.vinnhair.com/static/${res.objectKey}`
                }
              ]
              form.setFieldsValue({
                ...res,
                fileInfo: { fileList: newFileList }
              })
              setFileList(newFileList)

              return res
            }}
            onFinish={async (data) => {
              setLoading(true)
              const id = form.getFieldValue('id')
              const {
                fileInfo: {
                  fileList: [file]
                },
                ...other
              } = data

              const { uid, type, name } = file
              const objectKey = `${uid}.${type.replace(/[\w\W]+\//, '')}`

              const isUploadFile = file.status !== 'done'

              if (isUploadFile) {
                await uploadFile(file.originFileObj, objectKey, 'static')
              }

              await axios
                .post(`/mall/${id ? 'update' : 'create'}`, {
                  id: id || undefined,
                  ...other,
                  objectKey,
                  fileName: name,
                  uid,
                  fileType: type
                })
                .finally(() => {
                  setLoading(false)
                })

              message.success(`基本信息编辑成功`)
            }}
            submitter={
              perms.includes('edit-perm')
                ? {
                    render: (props: any, _dom: any) => {
                      return (
                        <FooterToolbar>
                          <Button
                            type="primary"
                            loading={loading}
                            onClick={async () => {
                              props.form?.submit?.()
                            }}
                          >
                            保存
                          </Button>
                        </FooterToolbar>
                      )
                    }
                  }
                : false
            }
          >
            <ProFormText
              width={500}
              name="name"
              label="品牌名称"
              rules={[
                {
                  required: true,
                  message: '请输入品牌名称'
                }
              ]}
            />
            <ProFormText
              width={500}
              name="introduce"
              label="品牌介绍"
              rules={[
                {
                  required: true,
                  message: '请输入品牌介绍'
                }
              ]}
            />
            <ProFormItem
              name="fileInfo"
              label="品牌logo"
              rules={[
                {
                  required: true,
                  message: '请选择图片'
                },
                () => ({
                  validator(_, value) {
                    if (value && !value.fileList.length) {
                      return Promise.reject(new Error('请选择图片'))
                    }
                    return Promise.resolve()
                  }
                })
              ]}
            >
              <Descriptions title="">
                <Descriptions.Item label="素材限制" contentStyle={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                  图片宽高比例为2:1。图片宽高均大于1200px，大小10M以内
                </Descriptions.Item>
              </Descriptions>
              <Upload
                accept={'.png,.jpg,.jpeg'}
                listType="picture-card"
                fileList={fileList}
                maxCount={1}
                onChange={async ({ file, fileList: newFileList }) => {
                  if (newFileList.length && !checkFileSize(file)) {
                    return
                  }
                  form.setFieldValue('fileInfo', { fileList: [...newFileList] })
                  setFileList(newFileList)
                  await form.validateFields()
                }}
                onRemove={() => {
                  setFileList([])
                }}
                beforeUpload={() => false}
                onPreview={(file) => {
                  const url = file.url || file.thumbUrl
                  if (!url) return
                  setPreviewInfo({
                    visible: true,
                    url
                  })
                }}
              >
                {fileList.length >= 1 ? null : (
                  <button style={{ border: 0, background: 'none' }} type="button">
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>上传</div>
                  </button>
                )}
              </Upload>
            </ProFormItem>
            <ProFormText
              width={500}
              name="email"
              label="联系邮箱"
              rules={[
                {
                  required: true,
                  message: '请输入联系邮箱'
                }
              ]}
            />
            <ProFormText
              width={500}
              name="phone"
              label="联系电话"
              rules={[
                {
                  required: true,
                  message: '请输入联系电话'
                }
              ]}
              fieldProps={{
                prefix: <span>+86</span>
              }}
            ></ProFormText>
            <ProFormText
              width={500}
              name="address"
              label="联系地址"
              rules={[
                {
                  required: true,
                  message: '请输入联系地址'
                }
              ]}
            ></ProFormText>
          </ProForm>

          <Image
            width={200}
            style={{ display: 'none' }}
            preview={{
              visible: previewInfo.visible,
              src: previewInfo.url,
              onVisibleChange: (value) => {
                setPreviewInfo({
                  visible: value,
                  url: ''
                })
              },
              toolbarRender: () => <span></span>
            }}
          />
        </Col>
      </Row>
    </PageContainer>
  )
}

export default Info
